import { createRouteHandler } from "uploadthing/next";
import { ourFileRouter } from "./core";

// Allow streaming for uploadthing
export const dynamic = "force-dynamic";

export const { GET, POST } = createRouteHandler({
  router: ourFileRouter,
});
