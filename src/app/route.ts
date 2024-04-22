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

export async function OPTIONS(request: Request) {
  return handleProxyRequest(request, "options");
}
