import { openApiDocument } from '@bounty/api';
import { NextResponse } from 'next/server';

export async function GET() {
  return NextResponse.json(openApiDocument);
}
