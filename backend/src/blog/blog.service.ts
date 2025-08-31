import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Post, PostDocument } from './schemas/post.schema';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { UserFromJwt } from '../auth/interfaces/request-with-user.interface';
import sanitizeHtml = require('sanitize-html');

@Injectable()
export class BlogService {
  constructor(@InjectModel(Post.name) private postModel: Model<PostDocument>) {}

  private sanitizeContent(content: string): string {
    return sanitizeHtml(content, {
      allowedTags: sanitizeHtml.defaults.allowedTags.concat(['img', 'h1', 'h2']),
      allowedAttributes: {
        ...sanitizeHtml.defaults.allowedAttributes,
        '*': ['class', 'style'],
        a: ['href', 'name', 'target'],
        img: ['src', 'srcset', 'alt', 'title', 'width', 'height', 'loading'],
      },
    });
  }

  async create(createPostDto: CreatePostDto, user: UserFromJwt): Promise<Post> {
    const sanitizedContent = this.sanitizeContent(createPostDto.content);
    const createdPost = new this.postModel({
      ...createPostDto,
      content: sanitizedContent,
      author: user.userId,
    });
    return createdPost.save();
  }

  async findAll(
    cursor?: string,
    limit = 10,
  ): Promise<{ posts: Post[]; nextCursor: string | null }> {
    const query = cursor ? { _id: { $gt: new Types.ObjectId(cursor) } } : {};
    const posts: any = await this.postModel
      .find(query)
      .sort({ _id: 1 })
      .limit(limit + 1)
      .exec();

    const hasNextPage = posts.length > limit;
    const nextCursor = hasNextPage ? posts[limit - 1]._id.toString() : null;

    const paginatedPosts = posts.slice(0, limit);

    return { posts: paginatedPosts, nextCursor };
  }

  async findOneBySlug(slug: string): Promise<Post> {
    const post = await this.postModel.findOne({ slug }).exec();
    if (!post) {
      throw new NotFoundException(`Post with slug "${slug}" not found`);
    }
    return post;
  }

  async update(
    id: string,
    updatePostDto: UpdatePostDto,
    userId: string,
  ): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    if (post.author.toString() !== userId) {
      throw new UnauthorizedException('You are not the author of this post');
    }

    if (updatePostDto.content) {
      updatePostDto.content = this.sanitizeContent(updatePostDto.content);
    }

    const updatedPost = await this.postModel
      .findByIdAndUpdate(id, updatePostDto, { new: true })
      .exec();
    if (!updatedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return updatedPost;
  }

  async remove(id: string, userId: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    if (post.author.toString() !== userId) {
      throw new UnauthorizedException('You are not the author of this post');
    }
    const deletedPost = await this.postModel.findByIdAndDelete(id).exec();
    if (!deletedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return deletedPost;
  }

  async publish(id: string, userId: string): Promise<Post> {
    const post = await this.postModel.findById(id).exec();
    if (!post) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    if (post.author.toString() !== userId) {
      throw new UnauthorizedException('You are not the author of this post');
    }
    const publishedPost = await this.postModel
      .findByIdAndUpdate(
        id,
        { status: 'published', publishedAt: new Date() },
        { new: true },
      )
      .exec();
    if (!publishedPost) {
      throw new NotFoundException(`Post with ID "${id}" not found`);
    }
    return publishedPost;
  }
}