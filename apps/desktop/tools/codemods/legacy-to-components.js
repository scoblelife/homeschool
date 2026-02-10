/**
 * JSCodeshift Codemod: Legacy Classes to Design System Components
 *
 * Transforms legacy CSS classes to design system components:
 * - button.btn.btn-primary → <Button variant="primary">
 * - input.input → <Input />
 * - div.card → <Card>
 * - span.badge.badge-success → <Badge variant="success">
 *
 * Usage:
 *   npx jscodeshift -t tools/codemods/legacy-to-components.js src/renderer/src/pages/
 */

module.exports = function transformer(file, api) {
  const j = api.jscodeshift
  const root = j(file.source)
  let modified = false

  // Track which imports we need to add
  const neededImports = new Set()

  /**
   * Helper: Parse className string to array
   */
  function parseClassNames(className) {
    if (typeof className !== 'string') return []
    return className.split(/\s+/).filter(Boolean)
  }

  /**
   * Helper: Build new className string without matched classes
   */
  function removeClasses(className, classesToRemove) {
    const classes = parseClassNames(className)
    const remaining = classes.filter(c => !classesToRemove.includes(c))
    return remaining.join(' ')
  }

  /**
   * Helper: Add import statement if not already present
   */
  function ensureImport(componentName) {
    neededImports.add(componentName)
  }

  /**
   * Transform button elements with .btn classes
   */
  function transformButtons() {
    root.find(j.JSXElement, {
      openingElement: { name: { name: 'button' } }
    }).forEach(path => {
      const classNameAttr = path.value.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      )

      if (!classNameAttr || !classNameAttr.value) return

      // Handle string literals
      if (classNameAttr.value.type === 'StringLiteral') {
        const className = classNameAttr.value.value
        const classes = parseClassNames(className)

        if (!classes.includes('btn')) return

        // Determine variant
        let variant = 'primary' // default
        const variantMap = {
          'btn-primary': 'primary',
          'btn-secondary': 'secondary',
          'btn-outline': 'outline',
          'btn-ghost': 'ghost',
          'btn-danger': 'danger'
        }

        for (const [cls, v] of Object.entries(variantMap)) {
          if (classes.includes(cls)) {
            variant = v
            break
          }
        }

        // Remove legacy classes
        const classesToRemove = ['btn', 'btn-primary', 'btn-secondary', 'btn-outline', 'btn-ghost', 'btn-danger']
        const newClassName = removeClasses(className, classesToRemove)

        // Update element
        path.value.openingElement.name = j.jsxIdentifier('Button')
        if (path.value.closingElement) {
          path.value.closingElement.name = j.jsxIdentifier('Button')
        }

        // Add variant prop
        const variantAttr = j.jsxAttribute(
          j.jsxIdentifier('variant'),
          j.literal(variant)
        )
        path.value.openingElement.attributes.unshift(variantAttr)

        // Update or remove className
        if (newClassName) {
          classNameAttr.value.value = newClassName
        } else {
          path.value.openingElement.attributes = path.value.openingElement.attributes.filter(
            attr => attr !== classNameAttr
          )
        }

        ensureImport('Button')
        modified = true
      }
    })
  }

  /**
   * Transform input elements with .input class
   */
  function transformInputs() {
    root.find(j.JSXElement, {
      openingElement: { name: { name: 'input' } }
    }).forEach(path => {
      const classNameAttr = path.value.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      )

      if (!classNameAttr || !classNameAttr.value) return

      if (classNameAttr.value.type === 'StringLiteral') {
        const className = classNameAttr.value.value
        const classes = parseClassNames(className)

        if (!classes.includes('input')) return

        const hasError = classes.includes('input-error')

        // Remove legacy classes
        const classesToRemove = ['input', 'input-error']
        const newClassName = removeClasses(className, classesToRemove)

        // Update element
        path.value.openingElement.name = j.jsxIdentifier('Input')

        // Add error prop if needed
        if (hasError) {
          const errorAttr = j.jsxAttribute(
            j.jsxIdentifier('error'),
            j.jsxExpressionContainer(j.booleanLiteral(true))
          )
          path.value.openingElement.attributes.push(errorAttr)
        }

        // Update or remove className
        if (newClassName) {
          classNameAttr.value.value = newClassName
        } else {
          path.value.openingElement.attributes = path.value.openingElement.attributes.filter(
            attr => attr !== classNameAttr
          )
        }

        ensureImport('Input')
        modified = true
      }
    })
  }

  /**
   * Transform div elements with .card class
   */
  function transformCards() {
    root.find(j.JSXElement, {
      openingElement: { name: { name: 'div' } }
    }).forEach(path => {
      const classNameAttr = path.value.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      )

      if (!classNameAttr || !classNameAttr.value) return

      if (classNameAttr.value.type === 'StringLiteral') {
        const className = classNameAttr.value.value
        const classes = parseClassNames(className)

        if (!classes.includes('card')) return

        const hasHover = classes.includes('card-hover')
        const hasInteractive = classes.includes('card-interactive')

        // Remove legacy classes
        const classesToRemove = ['card', 'card-hover', 'card-interactive']
        const newClassName = removeClasses(className, classesToRemove)

        // Update element
        path.value.openingElement.name = j.jsxIdentifier('Card')
        if (path.value.closingElement) {
          path.value.closingElement.name = j.jsxIdentifier('Card')
        }

        // Add props
        if (hasHover) {
          const hoverAttr = j.jsxAttribute(
            j.jsxIdentifier('hover'),
            j.jsxExpressionContainer(j.booleanLiteral(true))
          )
          path.value.openingElement.attributes.push(hoverAttr)
        }

        if (hasInteractive) {
          const interactiveAttr = j.jsxAttribute(
            j.jsxIdentifier('interactive'),
            j.jsxExpressionContainer(j.booleanLiteral(true))
          )
          path.value.openingElement.attributes.push(interactiveAttr)
        }

        // Update or remove className
        if (newClassName) {
          classNameAttr.value.value = newClassName
        } else {
          path.value.openingElement.attributes = path.value.openingElement.attributes.filter(
            attr => attr !== classNameAttr
          )
        }

        ensureImport('Card')
        modified = true
      }
    })
  }

  /**
   * Transform span elements with .badge class
   */
  function transformBadges() {
    root.find(j.JSXElement, {
      openingElement: { name: { name: 'span' } }
    }).forEach(path => {
      const classNameAttr = path.value.openingElement.attributes.find(
        attr => attr.type === 'JSXAttribute' && attr.name.name === 'className'
      )

      if (!classNameAttr || !classNameAttr.value) return

      if (classNameAttr.value.type === 'StringLiteral') {
        const className = classNameAttr.value.value
        const classes = parseClassNames(className)

        if (!classes.includes('badge')) return

        // Determine variant
        let variant = 'default' // default
        const variantMap = {
          'badge-primary': 'primary',
          'badge-secondary': 'secondary',
          'badge-success': 'success',
          'badge-warning': 'warning',
          'badge-danger': 'danger',
          'badge-info': 'info',
          'badge-default': 'default',
          // Legacy aliases
          'badge-indigo': 'primary',
          'badge-green': 'success',
          'badge-amber': 'warning',
          'badge-gray': 'default'
        }

        for (const [cls, v] of Object.entries(variantMap)) {
          if (classes.includes(cls)) {
            variant = v
            break
          }
        }

        // Remove legacy classes
        const classesToRemove = [
          'badge', 'badge-primary', 'badge-secondary', 'badge-success',
          'badge-warning', 'badge-danger', 'badge-info', 'badge-default',
          'badge-indigo', 'badge-green', 'badge-amber', 'badge-gray',
          'badge-student-fuchsia', 'badge-student-teal', 'badge-student-blue',
          'badge-student-orange', 'badge-student-purple', 'badge-student-green'
        ]
        const newClassName = removeClasses(className, classesToRemove)

        // Update element
        path.value.openingElement.name = j.jsxIdentifier('Badge')
        if (path.value.closingElement) {
          path.value.closingElement.name = j.jsxIdentifier('Badge')
        }

        // Add variant prop if not default
        if (variant !== 'default') {
          const variantAttr = j.jsxAttribute(
            j.jsxIdentifier('variant'),
            j.literal(variant)
          )
          path.value.openingElement.attributes.push(variantAttr)
        }

        // Update or remove className
        if (newClassName) {
          classNameAttr.value.value = newClassName
        } else {
          path.value.openingElement.attributes = path.value.openingElement.attributes.filter(
            attr => attr !== classNameAttr
          )
        }

        ensureImport('Badge')
        modified = true
      }
    })
  }

  // Run all transformations
  transformButtons()
  transformInputs()
  transformCards()
  transformBadges()

  // Add necessary imports
  if (neededImports.size > 0) {
    const existingImports = root.find(j.ImportDeclaration, {
      source: { value: '@/components/ui' }
    })

    if (existingImports.length > 0) {
      // Add to existing import
      const importDecl = existingImports.at(0).get()
      const existingSpecifiers = importDecl.value.specifiers.map(s => s.imported.name)

      neededImports.forEach(componentName => {
        if (!existingSpecifiers.includes(componentName)) {
          importDecl.value.specifiers.push(
            j.importSpecifier(j.identifier(componentName))
          )
        }
      })
    } else {
      // Create new import
      const specifiers = Array.from(neededImports).map(componentName =>
        j.importSpecifier(j.identifier(componentName))
      )
      const importDecl = j.importDeclaration(specifiers, j.literal('@/components/ui'))

      // Add after existing imports or at top
      const body = root.get().value.program.body
      const lastImportIndex = body.findIndex(
        node => node.type !== 'ImportDeclaration'
      )
      if (lastImportIndex > 0) {
        body.splice(lastImportIndex, 0, importDecl)
      } else {
        body.unshift(importDecl)
      }
    }
  }

  return modified ? root.toSource() : null
}
