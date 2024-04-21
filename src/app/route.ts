import { handleRequest } from "@/util";

export const dynamic = "force-dynamic"; // defaults to auto

export async function GET(request: Request) {
  return handleRequest(request, "get");
}
export async function POST(request: Request) {
  return handleRequest(request, "post");
}
export async function PUT(request: Request) {
  return handleRequest(request, "put");
}
export async function PATCH(request: Request) {
  return handleRequest(request, "patch");
}
export async function DELETE(request: Request) {
  return handleRequest(request, "delete");
}

export async function HEAD(request: Request) {
  return handleRequest(request, "head");
}

export async function OPTIONS(request: Request) {
  return handleRequest(request, "options");
}
