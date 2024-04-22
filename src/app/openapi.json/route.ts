import { handleOpenapiRequest } from "@/handleOpenapiRequest";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: Request) {
  return handleOpenapiRequest(request);
}
