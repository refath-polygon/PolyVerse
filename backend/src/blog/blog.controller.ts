import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Put,
  Delete,
  Query,
  UseGuards,
  Req,
  HttpStatus,
} from '@nestjs/common';
import { BlogService } from './blog.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import type {
  RequestWithUser,
  UserFromJwt,
} from '../auth/interfaces/request-with-user.interface';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Post as PostSchema } from './schemas/post.schema';

@ApiTags('posts')
@Controller('posts')
export class BlogController {
  constructor(private readonly blogService: BlogService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new post' })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'The post has been successfully created.',
    type: PostSchema,
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  create(@Body() createPostDto: CreatePostDto, @Req() req: RequestWithUser) {
    return this.blogService.create(createPostDto, req.user as UserFromJwt);
  }

  @Get()
  @ApiOperation({ summary: 'Retrieve all posts with cursor-based pagination' })
  @ApiQuery({
    name: 'cursor',
    required: false,
    type: String,
    description: 'The cursor for pagination',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'The number of items to return',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A list of posts.',
    type: [PostSchema],
  })
  findAll(@Query('cursor') cursor: string, @Query('limit') limit: string) {
    return this.blogService.findAll(cursor, limit ? parseInt(limit, 10) : 10);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search for posts' })
  @ApiQuery({
    name: 'q',
    required: true,
    type: String,
    description: 'The search query',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'A list of posts that match the search query.',
    type: [PostSchema],
  })
  search(@Query('q') query: string) {
    return this.blogService.search(query);
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get a single post by slug' })
  @ApiParam({ name: 'slug', type: String, description: 'The slug of the post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The found post.',
    type: PostSchema,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  findOne(@Param('slug') slug: string) {
    return this.blogService.findOneBySlug(slug);
  }

  @UseGuards(JwtAuthGuard)
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a post' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The updated post.',
    type: PostSchema,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  update(
    @Param('id') id: string,
    @Body() updatePostDto: UpdatePostDto,
    @Req() req: RequestWithUser,
  ) {
    return this.blogService.update(
      id,
      updatePostDto,
      (req.user as UserFromJwt).userId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a post' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The deleted post.',
    type: PostSchema,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  remove(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.blogService.remove(id, (req.user as UserFromJwt).userId);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':id/publish')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Publish a post' })
  @ApiParam({ name: 'id', type: String, description: 'The ID of the post' })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'The published post.',
    type: PostSchema,
  })
  @ApiResponse({ status: HttpStatus.NOT_FOUND, description: 'Post not found.' })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'Unauthorized.',
  })
  publish(@Param('id') id: string, @Req() req: RequestWithUser) {
    return this.blogService.publish(id, (req.user as UserFromJwt).userId);
  }
}