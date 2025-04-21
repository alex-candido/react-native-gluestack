export function DELETE(request: Request, _response: Response) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");

  if (!id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  return new Response(null, { status: 204 });
}
