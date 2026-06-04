import { createStartHandler, defaultRenderHandler } from '@tanstack/react-start/server'
import { getRouterManifest } from '@tanstack/react-start/server'
import { getRouter } from './router'

export default createStartHandler({
    createRouter: getRouter,
    getRouterManifest,
})(defaultRenderHandler)
