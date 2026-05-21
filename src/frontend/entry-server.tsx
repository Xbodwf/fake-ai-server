import React from 'react'
import { renderToString } from 'react-dom/server'
import { StaticRouter } from 'react-router-dom'
import App from './App'
import './i18n'

interface RenderOptions {
  url: string
  context?: any
}

export function render({ url, context = {} }: RenderOptions) {
  return renderToString(
    <StaticRouter location={url} context={context}>
      <App />
    </StaticRouter>
  )
}