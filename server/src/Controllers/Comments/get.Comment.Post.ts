import { Context } from "hono";
import { apiError } from "../../utils/apiError";
import { dbConnect } from "../../Connection/db.connect";
import { apiResponse } from "../../utils/apiResponse";

export async function getComments(c: Context) {
    try {
        const postId = c.req.param("postId");
        if (!postId) { return apiError(c, 400, "Post ID is required"); }

        const prisma: any = await dbConnect(c);

        const post = await prisma.post.findUnique({ where: { id: postId }, select: { id: true } });

        if (!post) { return apiError(c, 404, "Post not found"); }

        const comments = await prisma.comment.findMany({
            where: { postId },
            include: {
                author: {
                    select: { id: true, username: true, email: true }
                },
                parent: {
                    select: {
                        id: true, content: true,
                        author: { select: { id: true, username: true } }
                    }
                },
                replies: {
                    select: {
                        id: true, content: true,
                        author: {
                            select: {
                                id: true, username: true
                            }
                        }
                    },
                }
            },
            orderBy: { createdAt: "desc" }
        });

        if (!comments) { return apiError(c, 404, "Unable to load comments at the moment"); }

        return apiResponse(c, 200, { comments }, "Comments retrieved successfully");

    } catch (error: any) {
        console.log("Error in getComments: ", error);
        return apiError(c, 500, "Internal server error", { code: "CE" });
    }

}