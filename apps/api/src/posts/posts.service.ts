import { Injectable, ForbiddenException, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import { ModerationService } from '../moderation/moderation.service';
import { CreatePostDto } from './dto/create-post.dto';

const POLL_INCLUDE = {
  options: { orderBy: { position: 'asc' as const } },
};

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService, private notifs: NotificationsService, private moderation: ModerationService) {}

  async create(userId: string, dto: CreatePostDto) {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { status: true } });
    if (!user || user.status !== 'active') {
      throw new ForbiddenException('Akun kamu sedang menunggu persetujuan admin. Kamu belum bisa membuat postingan.');
    }

    if (dto.content?.trim()) {
      const mod = await this.moderation.check(dto.content);
      if (!mod.safe) {
        throw new BadRequestException(mod.reason ?? 'Konten melanggar aturan komunitas GUEPOSTING');
      }
    }

    const post = await this.prisma.post.create({
      data: {
        userId,
        content: dto.content,
        type: dto.type,
        gadgetId: dto.gadgetId,
        rating: dto.rating,
        mediaUrls: dto.mediaUrls ?? [],
        location: dto.location,
        taggedUserIds: dto.taggedUserIds ?? [],
        scheduledAt: dto.scheduledAt ? new Date(dto.scheduledAt) : null,
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
      },
    });

    if (dto.poll) {
      await this.prisma.poll.create({
        data: {
          postId: post.id,
          question: dto.poll.question,
          endsAt: new Date(Date.now() + dto.poll.durationDays * 24 * 60 * 60 * 1000),
          multipleChoice: dto.poll.multipleChoice ?? false,
          options: {
            create: dto.poll.options
              .filter((t) => t.trim())
              .map((text, i) => ({ text: text.trim(), position: i })),
          },
        },
      });
    }

    return post;
  }

  async findAll(page = 1, limit = 20, type?: string, search?: string) {
    const skip = (page - 1) * limit;
    const now = new Date();
    return this.prisma.post.findMany({
      skip,
      take: limit,
      where: {
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        ...(type ? { type: type as any } : {}),
        ...(search ? { content: { contains: search, mode: 'insensitive' as const } } : {}),
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        poll: { include: POLL_INCLUDE },
        _count: { select: { likes: true, comments: true } },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findTrending(userId: string, page = 1, limit = 20, type?: string) {
    const skip = (page - 1) * limit;
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const posts = await this.prisma.post.findMany({
      skip,
      take: limit,
      where: {
        createdAt: { gte: sevenDaysAgo },
        OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }],
        ...(type ? { type: type as any } : {}),
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        poll: {
          include: {
            ...POLL_INCLUDE,
            votes: { where: { userId }, select: { optionId: true } },
          },
        },
        likes: { where: { userId }, select: { reactionType: true } },
        bookmarks: { where: { userId }, select: { userId: true } },
      },
      orderBy: [{ likeCount: 'desc' }, { commentCount: 'desc' }, { createdAt: 'desc' }],
    });

    return posts.map(({ likes, bookmarks, poll, ...p }) => ({
      ...p,
      userReaction: likes[0]?.reactionType ?? null,
      isBookmarked: bookmarks.length > 0,
      poll: poll ? this.formatPoll(poll, poll.votes?.map((v: any) => v.optionId) ?? []) : null,
    }));
  }

  async findFeed(userId: string, cursor?: string) {
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId },
      select: { followingId: true },
    });
    const followingIds = following.map((f) => f.followingId);

    const now = new Date();
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { userId: { in: followingIds } },
          { userId },
        ],
        AND: [{ OR: [{ scheduledAt: null }, { scheduledAt: { lte: now } }] }],
      },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        poll: {
          include: {
            ...POLL_INCLUDE,
            votes: { where: { userId }, select: { optionId: true } },
          },
        },
        _count: { select: { likes: true, comments: true } },
        likes: { where: { userId }, select: { reactionType: true } },
        bookmarks: { where: { userId }, select: { userId: true } },
      },
      orderBy: { createdAt: 'desc' },
      take: 20,
      ...(cursor && { cursor: { id: cursor }, skip: 1 }),
    });

    return posts.map(({ likes, bookmarks, poll, ...p }) => ({
      ...p,
      userReaction: likes[0]?.reactionType ?? null,
      isBookmarked: bookmarks.length > 0,
      poll: poll ? this.formatPoll(poll, poll.votes?.map((v: any) => v.optionId) ?? []) : null,
    }));
  }

  private formatPoll(poll: any, userVoteOptionIds: string[] | string | null) {
    const totalVotes = poll.options.reduce((sum: number, o: any) => sum + o.voteCount, 0);
    const votedIds: string[] = Array.isArray(userVoteOptionIds)
      ? userVoteOptionIds
      : userVoteOptionIds != null
        ? [userVoteOptionIds]
        : [];
    return {
      id: poll.id,
      question: poll.question,
      endsAt: poll.endsAt,
      multipleChoice: poll.multipleChoice ?? false,
      totalVotes,
      userVote: votedIds[0] ?? null,
      userVotes: votedIds,
      options: poll.options.map((o: any) => ({
        id: o.id,
        text: o.text,
        voteCount: o.voteCount,
        position: o.position,
      })),
    };
  }

  async findOne(id: string) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: {
        user: { select: { id: true, username: true, displayName: true, avatarUrl: true, trustScore: true } },
        gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
        poll: { include: POLL_INCLUDE },
        comments: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
          },
          orderBy: { createdAt: 'asc' },
          take: 20,
        },
        _count: { select: { likes: true } },
      },
    });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    return post;
  }

  async delete(userId: string, postId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    if (post.userId !== userId) throw new ForbiddenException('Bukan post kamu');
    return this.prisma.post.delete({ where: { id: postId } });
  }

  async toggleReact(userId: string, postId: string, type = 'love') {
    const existing = await this.prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      if (existing.reactionType === type) {
        await this.prisma.$transaction([
          this.prisma.like.delete({ where: { userId_postId: { userId, postId } } }),
          this.prisma.post.update({ where: { id: postId }, data: { likeCount: { decrement: 1 } } }),
        ]);
        return { reacted: false, reactionType: null };
      } else {
        await this.prisma.like.update({
          where: { userId_postId: { userId, postId } },
          data: { reactionType: type },
        });
        return { reacted: true, reactionType: type };
      }
    } else {
      const [, post] = await this.prisma.$transaction([
        this.prisma.like.create({ data: { userId, postId, reactionType: type } }),
        this.prisma.post.update({ where: { id: postId }, data: { likeCount: { increment: 1 } } }),
      ]);
      this.notifs.createNotif({ userId: post.userId, actorId: userId, type: 'like', postId }).catch(() => {});
      return { reacted: true, reactionType: type };
    }
  }

  async votePoll(userId: string, postId: string, optionIds: string[]) {
    if (!optionIds || optionIds.length === 0) throw new BadRequestException('Pilih setidaknya satu opsi');

    const poll = await this.prisma.poll.findUnique({
      where: { postId },
      include: { options: { orderBy: { position: 'asc' } } },
    });
    if (!poll) throw new NotFoundException('Poll tidak ditemukan');
    if (poll.endsAt < new Date()) throw new BadRequestException('Poll sudah berakhir');

    const validOptionIds = poll.options.map((o) => o.id);
    for (const oid of optionIds) {
      if (!validOptionIds.includes(oid)) throw new NotFoundException(`Opsi ${oid} tidak valid`);
    }

    if (!poll.multipleChoice) {
      // Single choice: only 1 option allowed, undo previous votes first
      if (optionIds.length > 1) throw new BadRequestException('Poll ini hanya boleh satu pilihan');

      const optionId = optionIds[0];

      // Find and remove any existing votes by this user on this poll
      const existingVotes = await this.prisma.pollVote.findMany({
        where: { userId, pollId: poll.id },
      });

      if (existingVotes.length > 0) {
        await this.prisma.$transaction([
          this.prisma.pollVote.deleteMany({ where: { userId, pollId: poll.id } }),
          ...existingVotes.map((v) =>
            this.prisma.pollOption.update({ where: { id: v.optionId }, data: { voteCount: { decrement: 1 } } })
          ),
        ]);
      }

      await this.prisma.$transaction([
        this.prisma.pollVote.create({ data: { userId, pollId: poll.id, optionId } }),
        this.prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
      ]);
    } else {
      // Multiple choice: add each new vote, skip duplicates
      for (const optionId of optionIds) {
        const alreadyVoted = await this.prisma.pollVote.findUnique({
          where: { userId_optionId: { userId, optionId } },
        });
        if (!alreadyVoted) {
          await this.prisma.$transaction([
            this.prisma.pollVote.create({ data: { userId, pollId: poll.id, optionId } }),
            this.prisma.pollOption.update({ where: { id: optionId }, data: { voteCount: { increment: 1 } } }),
          ]);
        }
      }
    }

    const updated = await this.prisma.poll.findUnique({
      where: { id: poll.id },
      include: {
        options: { orderBy: { position: 'asc' } },
        votes: { where: { userId }, select: { optionId: true } },
      },
    });
    return this.formatPoll(updated, updated!.votes.map((v) => v.optionId));
  }

  async addComment(userId: string, postId: string, content: string) {
    if (content?.trim()) {
      const mod = await this.moderation.check(content);
      if (!mod.safe) {
        throw new BadRequestException(mod.reason ?? 'Komentar melanggar aturan komunitas GUEPOSTING');
      }
    }

    const [comment, post] = await this.prisma.$transaction([
      this.prisma.comment.create({
        data: { userId, postId, content },
        include: { user: { select: { id: true, username: true, displayName: true, avatarUrl: true } } },
      }),
      this.prisma.post.update({ where: { id: postId }, data: { commentCount: { increment: 1 } } }),
    ]);
    this.notifs.createNotif({ userId: post.userId, actorId: userId, type: 'comment', postId }).catch(() => {});
    return comment;
  }

  async toggleBookmark(userId: string, postId: string) {
    const existing = await this.prisma.bookmark.findUnique({
      where: { userId_postId: { userId, postId } },
    });

    if (existing) {
      await this.prisma.bookmark.delete({ where: { userId_postId: { userId, postId } } });
    } else {
      await this.prisma.bookmark.create({ data: { userId, postId } });
    }

    return { bookmarked: !existing };
  }

  async getBookmarks(userId: string) {
    return this.prisma.bookmark.findMany({
      where: { userId },
      include: {
        post: {
          include: {
            user: { select: { id: true, username: true, displayName: true, avatarUrl: true } },
            gadget: { select: { id: true, name: true, brand: true, imageUrl: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 30,
    });
  }
}
