import { handleOpenapiRequest } from "@/handleOpenapiRequest";
import { handleProxyRequest } from "@/handleProxyRequest";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: Request) {
  return handleProxyRequest(request, "get");
}
export async function POST(request: Request) {
  return handleProxyRequest(request, "post");
}
export async function PUT(request: Request) {
  return handleProxyRequest(request, "put");
}
export async function PATCH(request: Request) {
  return handleProxyRequest(request, "patch");
}
export async function DELETE(request: Request) {
  return handleProxyRequest(request, "delete");
}

export async function HEAD(request: Request) {
  return handleProxyRequest(request, "head");
}

// NB: according to convention stated in https://www.rfc-editor.org/rfc/rfc7231#section-4.3.7
export async function OPTIONS(request: Request) {
  return handleOpenapiRequest(request);
}
