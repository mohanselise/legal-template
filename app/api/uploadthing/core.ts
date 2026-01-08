import { createUploadthing, type FileRouter } from "uploadthing/next";
import { UploadThingError } from "uploadthing/server";
import { auth } from "@clerk/nextjs/server";
import { isOrgAdmin, getActiveOrganization } from "@/lib/auth/organization";

const f = createUploadthing();

export const ourFileRouter = {
  // Letterhead upload endpoint for organization settings
  letterheadUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
    pdf: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      try {
        const { userId, orgId, orgRole } = await auth();
        console.log("[UPLOADTHING] Auth result:", { userId, orgId, orgRole });

        if (!userId) {
          throw new UploadThingError("Unauthorized");
        }

        // Only org admins can upload letterheads
        const isAdmin = await isOrgAdmin();
        console.log("[UPLOADTHING] isAdmin:", isAdmin);

        if (!isAdmin) {
          throw new UploadThingError("Forbidden: Admin access required");
        }

        const org = await getActiveOrganization();
        console.log("[UPLOADTHING] Organization:", org?.id, org?.name);

        if (!org) {
          throw new UploadThingError("No active organization");
        }

        return { userId, organizationId: org.id };
      } catch (error) {
        console.error("[UPLOADTHING] Middleware error:", error);
        throw error;
      }
    })
    .onUploadComplete(async ({ metadata, file }) => {
      return {
        uploadedBy: metadata.userId,
        organizationId: metadata.organizationId,
        url: file.ufsUrl,
        key: file.key,
        name: file.name,
        type: file.type,
      };
    }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
