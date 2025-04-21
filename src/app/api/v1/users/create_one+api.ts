export async function POST(request: Request, _response: Response) {
  const body = await request.json();
  
  const newUser = {
    id: String(Date.now()),
    ...body,
  };

  return Response.json(newUser, { status: 201 });
}
