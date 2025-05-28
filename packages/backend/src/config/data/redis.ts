import { createClient, RedisClientType } from "redis";

class RedisClient {
  private static instance: RedisClient;
  private RedisClient: RedisClientType | null = null;

  private constructor() {}

  public static getInstance(): RedisClient {
    if (!RedisClient.instance) {
      RedisClient.instance = new RedisClient();
    }
    return RedisClient.instance;
  }

  async connect() {
    const REDIS_HOST = process.env.REDIS_HOST;
    const REDIS_PORT = process.env.REDIS_PORT;
    const REDIS_USERNAME = process.env.REDIS_USERNAME;
    const REDIS_PASSWORD = process.env.REDIS_PASSWORD;
    const REDIS_TOKEN_CACHE = process.env.REDIS_TOKEN_CACHE;

    if (!this.RedisClient) {
      this.RedisClient = createClient({
        url: `redis://${REDIS_USERNAME}:${REDIS_PASSWORD}@${REDIS_HOST}:${REDIS_PORT}/${REDIS_TOKEN_CACHE}`,
      });
      this.RedisClient.on("error", (err) => console.error("레디스 클라이언트 에러", err));
    }

    if (!this.RedisClient.isOpen) {
      await this.RedisClient.connect();
      console.log("레디스 클라이언트 연결 성공");
    }
  }

  async disconnect() {
    if (this.RedisClient && this.RedisClient.isOpen) {
      await this.RedisClient.quit();
      console.log("레디스 클라이언트 연결 종료");
    }
  }

  async set(key: string, value: string): Promise<void> {
    if (!this.RedisClient) {
      throw new Error("Redis 클라이언트가 초기화되지 않았습니다");
    }
    const REDIS_TOKEN_EXPIRES = process.env.REDIS_TOKEN_EXPIRES;
    await this.RedisClient.set(key, value, {
      EX: Number(REDIS_TOKEN_EXPIRES),
    });
  }

  async setUser(key: string, value: string): Promise<void> {
    if (!this.RedisClient) {
      throw new Error("Redis 클라이언트가 초기화되지 않았습니다");
    }
    await this.RedisClient.set(key, value, {
      EX: 60 * 60,
    });
  }

  async get(key: string): Promise<string | null> {
    if (!this.RedisClient) {
      throw new Error("Redis 클라이언트가 초기화되지 않았습니다");
    }

    const value = await this.RedisClient.get(key);
    return value;
  }

  async del(key: string): Promise<void> {
    if (!this.RedisClient) {
      throw new Error("Redis 클라이언트가 초기화되지 않았습니다");
    }

    await this.RedisClient.del(key);
  }
}

export default RedisClient;
