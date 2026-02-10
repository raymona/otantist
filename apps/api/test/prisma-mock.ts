import { PrismaService } from '@/prisma/prisma.service';

type MockMethods = {
  findMany: jest.Mock;
  findFirst: jest.Mock;
  findUnique: jest.Mock;
  create: jest.Mock;
  createMany: jest.Mock;
  update: jest.Mock;
  updateMany: jest.Mock;
  upsert: jest.Mock;
  delete: jest.Mock;
  deleteMany: jest.Mock;
  count: jest.Mock;
};

function createModelMock(): MockMethods {
  return {
    findMany: jest.fn(),
    findFirst: jest.fn(),
    findUnique: jest.fn(),
    create: jest.fn(),
    createMany: jest.fn(),
    update: jest.fn(),
    updateMany: jest.fn(),
    upsert: jest.fn(),
    delete: jest.fn(),
    deleteMany: jest.fn(),
    count: jest.fn(),
  };
}

const modelNames = [
  'account',
  'user',
  'inviteCode',
  'authToken',
  'parentManagedAccount',
  'communicationPreference',
  'timeBoundary',
  'conversationStarter',
  'sensoryPreference',
  'userState',
  'interest',
  'conversation',
  'message',
  'blockedUser',
  'moderationQueue',
  'userReport',
  'parentAlert',
  'memberIndicator',
  'messageDeletion',
  'conversationHidden',
] as const;

export type MockPrismaService = {
  [K in (typeof modelNames)[number]]: MockMethods;
} & {
  $transaction: jest.Mock;
  $connect: jest.Mock;
  $disconnect: jest.Mock;
};

export function createMockPrismaService(): MockPrismaService {
  const mock: any = {
    $transaction: jest.fn(fn => {
      if (typeof fn === 'function') {
        return fn(mock);
      }
      return Promise.resolve(fn);
    }),
    $connect: jest.fn(),
    $disconnect: jest.fn(),
  };

  for (const name of modelNames) {
    mock[name] = createModelMock();
  }

  return mock;
}

export const PRISMA_SERVICE_TOKEN = {
  provide: PrismaService,
  useFactory: createMockPrismaService,
};
