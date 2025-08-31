import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Schema as MongooseSchema } from 'mongoose';

export type PostDocument = Post & Document;

@Schema({ timestamps: true })
export class Post {
  @Prop({ required: true })
  title: string;

  @Prop({ required: true, unique: true, index: true })
  slug: string;

  @Prop()
  summary: string;

  @Prop({ required: true })
  content: string;

  @Prop({ type: MongooseSchema.Types.ObjectId, ref: 'User', required: true, index: true })
  author: MongooseSchema.Types.ObjectId;

  @Prop([{ type: MongooseSchema.Types.ObjectId, ref: 'Tag' }])
  tags: MongooseSchema.Types.ObjectId[];

  @Prop({ default: 'draft', index: true })
  status: string;

  @Prop()
  publishedAt: Date;

  @Prop()
  featuredImage: string;

  @Prop({ default: 0 })
  views: number;

  @Prop({ default: 0 })
  likes: number;

  @Prop({ default: 0 })
  commentsCount: number;

  @Prop({ type: MongooseSchema.Types.Mixed })
  meta: any;

  @Prop()
  metaTitle: string;

  @Prop()
  metaDescription: string;
}

export const PostSchema = SchemaFactory.createForClass(Post);
