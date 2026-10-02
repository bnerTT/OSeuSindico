import { NextRequest, NextResponse } from 'next/server'

const getBackendUrl = (): string => {
  return (
    process.env.BACKEND_INTERNAL_URL ||
    process.env.NEXT_PUBLIC_BASE_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://localhost:8000'
  ).replace(/\/$/, '')
}

async function handleProxy(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  const { path } = await params
  const targetPath = '/' + (path ? path.join('/') : '')

  const searchParams = req.nextUrl.search
  const backendBase = getBackendUrl()
  let targetUrl = `${backendBase}${targetPath}${searchParams}`

  // Garante a barra final necessária para o Django router (APPEND_SLASH)
  if (!targetUrl.includes('?') && !targetUrl.endsWith('/')) {
    targetUrl += '/'
  } else if (targetUrl.includes('?')) {
    const [base, query] = targetUrl.split('?')
    if (!base.endsWith('/')) {
      targetUrl = `${base}/?${query}`
    }
  }

  const headers: Record<string, string> = {
    Accept: 'application/json',
  }

  const authHeader = req.headers.get('authorization')
  if (authHeader) {
    headers['Authorization'] = authHeader
  }

  const contentType = req.headers.get('content-type')
  if (contentType) {
    headers['Content-Type'] = contentType
  }

  const hasBody = req.method !== 'GET' && req.method !== 'HEAD'
  let body: string | undefined = undefined

  if (hasBody) {
    body = await req.text()
  }

  try {
    const backendRes = await fetch(targetUrl, {
      method: req.method,
      headers,
      body,
      cache: 'no-store',
    })

    if (backendRes.status === 204) {
      return new NextResponse(null, { status: 204 })
    }

    const responseData = await backendRes.text()
    const responseHeaders = new Headers()
    const backendContentType = backendRes.headers.get('content-type')

    if (backendContentType) {
      responseHeaders.set('content-type', backendContentType)
    } else {
      responseHeaders.set('content-type', 'application/json; charset=utf-8')
    }

    return new NextResponse(responseData, {
      status: backendRes.status,
      headers: responseHeaders,
    })
  } catch (error: any) {
    return NextResponse.json(
      { detail: `Falha ao comunicar com o servidor backend: ${error.message || error}` },
      { status: 502 }
    )
  }
}

export const GET = handleProxy
export const POST = handleProxy
export const PUT = handleProxy
export const PATCH = handleProxy
export const DELETE = handleProxy
