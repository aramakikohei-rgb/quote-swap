import { NextRequest, NextResponse } from 'next/server';
import { getAllQuotes, getRandomQuote, addQuote, updateQuote, deleteQuote } from '@/lib/quotes';

function checkAuth(request: NextRequest): boolean {
  const password = request.headers.get('x-admin-password');
  return password === process.env.ADMIN_PASSWORD;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const all = searchParams.get('all');

  if (all === 'true') {
    return NextResponse.json(getAllQuotes());
  }

  return NextResponse.json(getRandomQuote());
}

export async function POST(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { quote, author, bio, source, sourceUrl, imageUrl, quoteJa, tags } = body;

  if (!quote || !author) {
    return NextResponse.json({ error: 'Quote and author are required' }, { status: 400 });
  }

  const newQuote = addQuote({
    quote,
    author,
    bio: bio || '',
    source: source || '',
    sourceUrl: sourceUrl || '',
    imageUrl: imageUrl || '',
    quoteJa: quoteJa || '',
    tags: tags || [],
  });

  return NextResponse.json(newQuote, { status: 201 });
}

export async function PUT(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { id, ...data } = body;

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const updated = updateQuote(id, data);
  if (!updated) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  return NextResponse.json(updated);
}

export async function DELETE(request: NextRequest) {
  if (!checkAuth(request)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'ID is required' }, { status: 400 });
  }

  const deleted = deleteQuote(id);
  if (!deleted) {
    return NextResponse.json({ error: 'Quote not found' }, { status: 404 });
  }

  return NextResponse.json({ success: true });
}
