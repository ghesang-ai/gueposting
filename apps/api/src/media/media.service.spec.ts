import { Test } from '@nestjs/testing';
import { MediaService } from './media.service';
import { ConfigService } from '@nestjs/config';

const mockConfig = {
  get: jest.fn((key: string) => {
    const map: Record<string, string> = {
      SUPABASE_URL: 'https://test.supabase.co',
      SUPABASE_SERVICE_KEY: 'test-key',
      SUPABASE_STORAGE_BUCKET: 'dekat-media',
    };
    return map[key];
  }),
};

describe('MediaService', () => {
  let service: MediaService;

  beforeEach(async () => {
    const module = await Test.createTestingModule({
      providers: [
        MediaService,
        { provide: ConfigService, useValue: mockConfig },
      ],
    }).compile();
    service = module.get(MediaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  it('generateFilePath should return path with userId prefix', () => {
    const path = service.generateFilePath('user-123', 'image.jpg');
    expect(path).toMatch(/^user-123\//);
    expect(path).toMatch(/\.jpg$/);
  });
});
