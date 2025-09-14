import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ElasticsearchService as EsService } from '@nestjs/elasticsearch';
import { Post } from '../blog/schemas/post.schema';

@Injectable()
export class ElasticsearchService implements OnModuleInit {
  private readonly logger = new Logger(ElasticsearchService.name);
  constructor(private readonly esService: EsService) {}

  async onModuleInit() {
    await this.createIndex();
  }

  async createIndex() {
    const index = 'posts';
    try {
      const checkIndex = await this.esService.indices.exists({ index });
      if (!checkIndex) {
        await this.esService.indices.create({
          index,
          mappings: {
            properties: {
              title: { type: 'text' },
              content: { type: 'text' },
              author: { type: 'keyword' },
            },
          },
        });
        this.logger.log(`Index ${index} created.`);
      } else {
        this.logger.log(`Index ${index} already exists.`);
      }
    } catch (error) {
      this.logger.error(`Error creating index ${index}`, error);
    }
  }

  async indexPost(post: Post & { _id: any }) {
    return this.esService.index({
      index: 'posts',
      id: post._id.toString(),
      document: {
        id: post._id.toString(),
        title: post.title,
        content: post.content,
        author: post.author,
      },
    });
  }

  async search(query: string) {
    const { hits } = await this.esService.search({
      index: 'posts',
      query: {
        multi_match: {
          query,
          fields: ['title', 'content'],
        },
      },
    });
    return hits.hits.map((hit) => hit._source);
  }

  async update(post: Post & { _id: any }) {
    const { _id, title, content, author } = post;
    const script = `
      ctx._source.title = params.title;
      ctx._source.content = params.content;
      ctx._source.author = params.author;
    `;

    return this.esService.updateByQuery({
      index: 'posts',
      query: {
        match: {
          id: _id.toString(),
        },
      },
      script: {
        source: script,
        params: {
          title,
          content,
          author,
        },
      },
    });
  }

  async remove(postId: string) {
    return this.esService.deleteByQuery({
      index: 'posts',
      query: {
        match: {
          id: postId,
        },
      },
    });
  }
}

