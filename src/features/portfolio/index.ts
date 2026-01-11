export {
  generatePortfolioPDF,
  previewPortfolioHTML,
  getDefaultConfig,
  getCurrentSchoolYear
} from './pdfGenerator'

export { collectPortfolioData } from './dataCollector'

export { DEFAULT_SECTIONS } from './types'

export type {
  PortfolioConfig,
  PortfolioSection,
  PortfolioData,
  GeneratePDFResult
} from './types'
