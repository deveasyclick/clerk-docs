import fs from 'fs/promises'
import path from 'path'

async function main() {
  try {
    let jsonData = ''
    process.stdin.setEncoding('utf8')

    for await (const chunk of process.stdin) {
      jsonData += chunk
    }
    const parsedData = JSON.parse(jsonData)
    const errors = parsedData.errors

    const errorsByFile = errors.reduce((acc, error) => {
      const file = error.file
      if (!acc[file]) {
        acc[file] = []
      }
      acc[file].push(error)
      return acc
    }, {})

    // Create the /errors directory if it doesn't exist
    await fs.mkdir('errors', { recursive: true })

    // Generate MDX files for each group
    for (const [fileName, fileErrors] of Object.entries(errorsByFile)) {
      // Convert file name from snake_case to kebab-case
      const mdxFileName = fileName.replace(/_/g, '-').replace('.go', '.mdx')
      const mdxPath = path.join('errors', mdxFileName)

      // Generate MDX content
      const mdxContent = generateMDXContent(fileErrors)

      // Write the MDX file
      await fs.writeFile(mdxPath, mdxContent, 'utf8')
      console.log(`Generated ${mdxPath}`)
    }
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

function generateMDXContent(errors) {
  const title = errors[0].file
    .replace('.go', '')
    .split('_')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ')

  return `---
title: ${title} Errors
---

# ${title} Errors

${errors
  .map(
    (error) => `
## ${error.name}

${error.shortMessage}

${error.longMessage}
`,
  )
  .join('\n')}
`
}

main()
