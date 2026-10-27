import { NextRequest } from "next/server";
import { POST as researchPost } from "../research/route";

export async function POST(req: NextRequest) {
  // Delegate directly to the real research crawler
  return researchPost(req);
}
