import {NextResponse,type NextRequest} from 'next/server';
import {publicRequestAllowed} from './features/invitations/public-policy';
export function proxy(request:NextRequest){
 if(!publicRequestAllowed(request.nextUrl.pathname,request.nextUrl.searchParams.get('url'),process.env))return new NextResponse('Not Found',{status:404,headers:{'Cache-Control':'no-store','X-Robots-Tag':'noindex, nofollow','Content-Type':'text/plain; charset=utf-8'}});
 return NextResponse.next();
}
export const config={matcher:['/invitacion/:path*','/invitations/:path*','/_next/image','/.convete/:path*']};
