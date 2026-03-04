import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const name = searchParams.get('name');

  if (!name) {
    return NextResponse.json({ error: 'Name parameter required' }, { status: 400 });
  }

  try {
    const wikiTitle = name.replace(/ /g, '_');
    const apiUrl = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&piprop=original&origin=*`;

    const res = await fetch(apiUrl);
    const data = await res.json();
    const pages = data.query?.pages;

    if (pages) {
      const page = Object.values(pages)[0] as { original?: { source: string } };
      if (page?.original?.source) {
        return NextResponse.json({ imageUrl: page.original.source });
      }
    }

    return NextResponse.json({ imageUrl: '' });
  } catch {
    return NextResponse.json({ imageUrl: '' });
  }
}
