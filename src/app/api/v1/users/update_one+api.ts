export async function PUT(request: Request, _response: Response) {
  const body = await request.json();

  if (!body.id) {
    return new Response(JSON.stringify({ error: 'ID obrigatório' }), { status: 400 });
  }

  const updatedUser = { ...body };

  return Response.json(updatedUser);
}
