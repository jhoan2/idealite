"use server";

import { db } from "~/server/db";
import { blogPosts } from "~/server/db/schema";
import { eq, sql } from "drizzle-orm";
import { z } from "zod";
import { revalidatePath } from "next/cache";
import { currentUser } from "@clerk/nextjs/server";

/**
 * Check if user is admin
 */
async function checkIsAdmin() {
  const user = await currentUser();

  if (!user || user.publicMetadata.role !== "admin") {
    throw new Error("Unauthorized: Admin access required");
  }

  return user;
}

/**
 * Generate a URL-friendly slug from a title
 */
export async function generateSlug(title: string): Promise<string> {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "") // Remove non-word chars
    .replace(/[\s_-]+/g, "-") // Replace spaces and underscores with hyphens
    .replace(/^-+|-+$/g, ""); // Remove leading/trailing hyphens
}

// Schemas
const createBlogPostSchema = z.object({
  title: z.string().min(1, "Title is required"),
  slug: z.string().min(1, "Slug is required"),
  content: z.string().min(1, "Content is required"),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().default(false),
});

const updateBlogPostSchema = z.object({
  id: z.number(),
  title: z.string().min(1, "Title is required").optional(),
  slug: z.string().min(1, "Slug is required").optional(),
  content: z.string().min(1, "Content is required").optional(),
  excerpt: z.string().optional(),
  coverImage: z.string().optional(),
  published: z.boolean().optional(),
});

const deleteBlogPostSchema = z.object({
  id: z.number(),
});

const deleteMultipleBlogPostsSchema = z.object({
  ids: z.array(z.number()).min(1),
});

/**
 * Create a new blog post
 */
export async function createBlogPost(
  input: z.infer<typeof createBlogPostSchema>,
) {
  try {
    await checkIsAdmin();

    const validatedInput = createBlogPostSchema.parse(input);

    // Check if slug already exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.slug, validatedInput.slug),
    });

    if (existingPost) {
      return {
        success: false,
        error: "A post with this slug already exists",
      };
    }

    const [newPost] = await db
      .insert(blogPosts)
      .values({
        ...validatedInput,
        publishedAt: validatedInput.published ? new Date() : null,
        createdAt: new Date(),
        updatedAt: new Date(),
      })
      .returning();

    if (!newPost) {
      throw new Error("Failed to create blog post");
    }

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      data: newPost,
    };
  } catch (error) {
    console.error("Error creating blog post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to create post",
    };
  }
}

/**
 * Update a blog post
 */
export async function updateBlogPost(
  input: z.infer<typeof updateBlogPostSchema>,
) {
  try {
    await checkIsAdmin();

    const validatedInput = updateBlogPostSchema.parse(input);

    // Check if post exists
    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, validatedInput.id),
    });

    if (!existingPost) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    // If slug is being updated, check for conflicts
    if (validatedInput.slug && validatedInput.slug !== existingPost.slug) {
      const slugConflict = await db.query.blogPosts.findFirst({
        where: eq(blogPosts.slug, validatedInput.slug),
      });

      if (slugConflict) {
        return {
          success: false,
          error: "A post with this slug already exists",
        };
      }
    }

    // Prepare update data
    const updateData: any = {
      ...validatedInput,
      updatedAt: new Date(),
    };

    // If changing to published status, set publishedAt
    if (validatedInput.published && !existingPost.published) {
      updateData.publishedAt = new Date();
    }

    // If changing to unpublished, clear publishedAt
    if (validatedInput.published === false && existingPost.published) {
      updateData.publishedAt = null;
    }

    const [updatedPost] = await db
      .update(blogPosts)
      .set(updateData)
      .where(eq(blogPosts.id, validatedInput.id))
      .returning();

    if (!updatedPost) {
      throw new Error("Failed to update blog post");
    }

    revalidatePath("/admin/blog");
    revalidatePath(`/admin/blog/${validatedInput.id}/edit`);
    revalidatePath("/blog");
    if (existingPost.slug) {
      revalidatePath(`/blog/${existingPost.slug}`);
    }
    if (updatedPost.slug && updatedPost.slug !== existingPost.slug) {
      revalidatePath(`/blog/${updatedPost.slug}`);
    }

    return {
      success: true,
      data: updatedPost,
    };
  } catch (error) {
    console.error("Error updating blog post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to update post",
    };
  }
}

/**
 * Delete a blog post
 */
export async function deleteBlogPost(
  input: z.infer<typeof deleteBlogPostSchema>,
) {
  try {
    await checkIsAdmin();

    const { id } = deleteBlogPostSchema.parse(input);

    const existingPost = await db.query.blogPosts.findFirst({
      where: eq(blogPosts.id, id),
    });

    if (!existingPost) {
      return {
        success: false,
        error: "Post not found",
      };
    }

    await db.delete(blogPosts).where(eq(blogPosts.id, id));

    revalidatePath("/admin/blog");
    revalidatePath("/blog");
    if (existingPost.slug) {
      revalidatePath(`/blog/${existingPost.slug}`);
    }

    return {
      success: true,
    };
  } catch (error) {
    console.error("Error deleting blog post:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete post",
    };
  }
}

/**
 * Delete multiple blog posts
 */
export async function deleteMultipleBlogPosts(
  input: z.infer<typeof deleteMultipleBlogPostsSchema>,
) {
  try {
    await checkIsAdmin();

    const { ids } = deleteMultipleBlogPostsSchema.parse(input);

    // Delete all posts in one query
    await db.delete(blogPosts).where(sql`${blogPosts.id} = ANY(${ids})`);

    revalidatePath("/admin/blog");
    revalidatePath("/blog");

    return {
      success: true,
      deletedCount: ids.length,
    };
  } catch (error) {
    console.error("Error deleting multiple blog posts:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Failed to delete posts",
    };
  }
}
