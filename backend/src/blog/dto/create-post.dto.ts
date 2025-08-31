import { IsString, IsNotEmpty, IsOptional, IsArray } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreatePostDto {
  @ApiProperty({ description: 'The title of the post', example: 'My First Blog Post' })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({ description: 'The URL-friendly slug for the post', example: 'my-first-blog-post' })
  @IsString()
  @IsNotEmpty()
  slug: string;

  @ApiProperty({ description: 'A short summary of the post', required: false, example: 'This is a summary of my first post.' })
  @IsString()
  @IsOptional()
  summary: string;

  @ApiProperty({ description: 'The main content of the post', example: '<h1>Hello World</h1><p>This is the content.</p>' })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiProperty({ description: 'An array of tag IDs associated with the post', required: false, type: [String] })
  @IsArray()
  @IsOptional()
  tags: string[];

  @ApiProperty({ description: 'URL of the featured image for the post', required: false, example: 'https://example.com/image.jpg' })
  @IsString()
  @IsOptional()
  featuredImage: string;

  @ApiProperty({ description: 'The SEO title for the post', required: false, example: 'My Awesome First Blog Post' })
  @IsString()
  @IsOptional()
  metaTitle: string;

  @ApiProperty({ description: 'The SEO meta description for the post', required: false, example: 'A detailed description for SEO purposes.' })
  @IsString()
  @IsOptional()
  metaDescription: string;
}
