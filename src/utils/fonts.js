// Candidate font names commonly bundled with Windows, macOS and Linux distros.
// Detection below checks which of these actually render on this browser/OS.
const CANDIDATE_FONTS = [
  // Windows
  'Arial', 'Arial Black', 'Bahnschrift', 'Calibri', 'Cambria', 'Candara',
  'Comic Sans MS', 'Consolas', 'Constantia', 'Corbel', 'Courier New',
  'Ebrima', 'Franklin Gothic Medium', 'Gabriola', 'Gadugi', 'Georgia',
  'Impact', 'Ink Free', 'Leelawadee UI', 'Lucida Console',
  'Lucida Sans Unicode', 'Malgun Gothic', 'Microsoft Sans Serif',
  'Microsoft YaHei', 'MS Gothic', 'MV Boli', 'Myanmar Text', 'Nirmala UI',
  'Palatino Linotype', 'Segoe Print', 'Segoe Script', 'Segoe UI',
  'Segoe UI Symbol', 'SimSun', 'Sitka', 'Sylfaen', 'Tahoma',
  'Times New Roman', 'Trebuchet MS', 'Verdana', 'Yu Gothic',
  // macOS
  'American Typewriter', 'Andale Mono', 'Arial Narrow',
  'Arial Rounded MT Bold', 'Avenir', 'Avenir Next', 'Baskerville',
  'Big Caslon', 'Bodoni 72', 'Bradley Hand', 'Brush Script MT',
  'Chalkboard', 'Chalkduster', 'Charter', 'Cochin', 'Copperplate',
  'Courier', 'Didot', 'DIN Alternate', 'Futura', 'Geneva', 'Gill Sans',
  'Helvetica', 'Helvetica Neue', 'Herculanum', 'Hoefler Text',
  'Lucida Grande', 'Luminari', 'Marker Felt', 'Menlo', 'Monaco',
  'Noteworthy', 'Optima', 'Palatino', 'Papyrus', 'Rockwell',
  'Savoye LET', 'SignPainter', 'Skia', 'Snell Roundhand', 'Times',
  'Zapfino',
  // Linux
  'DejaVu Sans', 'DejaVu Serif', 'DejaVu Sans Mono', 'Liberation Sans',
  'Liberation Serif', 'Liberation Mono', 'Ubuntu', 'Noto Sans',
  'Noto Serif', 'Cantarell', 'Droid Sans',
]

const GENERIC_FAMILIES = ['monospace', 'sans-serif', 'serif']
const TEST_STRING = 'mmmmmmmmmmlli'
const TEST_SIZE = '72px'

const measureWidth = (ctx, fontFamily) => {
  ctx.font = `${TEST_SIZE} ${fontFamily}`
  return ctx.measureText(TEST_STRING).width
}

const isFontAvailable = (ctx, font, baselineWidths) => {
  return GENERIC_FAMILIES.some(generic => {
    const width = measureWidth(ctx, `"${font}", ${generic}`)
    return width !== baselineWidths[generic]
  })
}

// Canvas-based heuristic: works in any browser without permissions, but can
// only confirm fonts we already suspect might be installed (see CANDIDATE_FONTS).
export const detectAvailableFonts = () => {
  const canvas = document.createElement('canvas')
  const ctx = canvas.getContext('2d')

  const baselineWidths = Object.fromEntries(
    GENERIC_FAMILIES.map(generic => [generic, measureWidth(ctx, generic)])
  )

  return CANDIDATE_FONTS
    .filter(font => isFontAvailable(ctx, font, baselineWidths))
    .sort((a, b) => a.localeCompare(b))
}

// Local Font Access API: gives the real, complete list of installed fonts,
// but is Chromium-only, requires a secure context, and must be triggered by
// a user gesture (it prompts for permission).
export const canQueryLocalFonts = () => typeof window !== 'undefined' && 'queryLocalFonts' in window

export const queryLocalFontFamilies = async () => {
  const fonts = await window.queryLocalFonts()
  const families = new Set(fonts.map(font => font.family))
  return [...families].sort((a, b) => a.localeCompare(b))
}
