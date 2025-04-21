export function GET(_request: Request, _response: Response) {
  const users = [
    { id: '1', name: 'João', email: 'joao@email.com' },
    { id: '2', name: 'Maria', email: 'maria@email.com' },
  ];

  return Response.json(users);
}
