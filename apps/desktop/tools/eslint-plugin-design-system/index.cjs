/**
 * ESLint Plugin for Design System Enforcement
 *
 * Custom rules to ensure consistent usage of design tokens and components.
 */

module.exports = {
  rules: {
    /**
     * Rule: no-hardcoded-colors
     * Prevents direct use of color classes like bg-fuchsia-500 in favor of semantic tokens
     */
    'no-hardcoded-colors': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Prevent hardcoded Tailwind color classes, use design system tokens instead',
          category: 'Design System',
          recommended: true,
        },
        messages: {
          hardcodedColor: 'Avoid hardcoded color "{{class}}". Use design system colors (e.g., bg-brand-primary, text-status-success).',
        },
        schema: [],
      },
      create(context) {
        // Pattern to match color classes like bg-fuchsia-500, text-amber-600, etc.
        const colorClassPattern = /(bg|text|border)-(fuchsia|teal|blue|orange|purple|green|amber|red)(-\d+)?/g

        return {
          JSXAttribute(node) {
            if (node.name.name === 'className') {
              const value = node.value?.value
              if (typeof value === 'string') {
                const matches = value.match(colorClassPattern)
                if (matches) {
                  // Allow child1/child2 as they're legacy aliases
                  const isLegacy = value.includes('child1') || value.includes('child2')
                  if (!isLegacy) {
                    context.report({
                      node,
                      messageId: 'hardcodedColor',
                      data: { class: matches[0] },
                    })
                  }
                }
              }
            }
          },
        }
      },
    },

    /**
     * Rule: require-design-system-components
     * Warns when using raw HTML elements with styling instead of design system components
     */
    'require-design-system-components': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Use design system components instead of styled HTML elements',
          category: 'Design System',
          recommended: true,
        },
        messages: {
          useComponent: 'Use <{{component}} /> from design system instead of styled <{{element}} />.',
        },
        schema: [],
      },
      create(context) {
        const elementToComponent = {
          button: 'Button',
          input: 'Input',
          textarea: 'Textarea',
        }

        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name

            if (elementToComponent[elementName]) {
              const hasClassOrStyle = node.openingElement.attributes.some(
                attr =>
                  (attr.name?.name === 'className' && attr.value?.value?.length > 0) ||
                  attr.name?.name === 'style'
              )

              if (hasClassOrStyle) {
                context.report({
                  node,
                  messageId: 'useComponent',
                  data: {
                    element: elementName,
                    component: elementToComponent[elementName],
                  },
                })
              }
            }
          },
        }
      },
    },

    /**
     * Rule: no-legacy-classes
     * Detects usage of deprecated CSS classes
     */
    'no-legacy-classes': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Avoid legacy CSS classes, use design system components instead',
          category: 'Design System',
          recommended: true,
        },
        messages: {
          legacyClass: 'Legacy class "{{class}}" is deprecated. Use design system components instead.',
        },
        schema: [],
      },
      create(context) {
        const legacyClasses = [
          'btn',
          'btn-primary',
          'btn-secondary',
          'btn-outline',
          'btn-ghost',
          'btn-danger',
          'input',
          'input-error',
          'label',
          'card',
          'card-hover',
          'card-interactive',
        ]

        return {
          JSXAttribute(node) {
            if (node.name.name === 'className') {
              const value = node.value?.value
              if (typeof value === 'string') {
                legacyClasses.forEach(legacyClass => {
                  if (value.includes(legacyClass)) {
                    context.report({
                      node,
                      messageId: 'legacyClass',
                      data: { class: legacyClass },
                    })
                  }
                })
              }
            }
          },
        }
      },
    },

    /**
     * Rule: pages-use-components-only
     * Flags complex inline styling in page components
     */
    'pages-use-components-only': {
      meta: {
        type: 'suggestion',
        docs: {
          description: 'Page components should use design system components, not complex inline styles',
          category: 'Design System',
          recommended: true,
        },
        messages: {
          complexStyling: 'Complex inline styling detected in page. Consider extracting to a component.',
        },
        schema: [],
      },
      create(context) {
        const filename = context.getFilename()

        // Only apply to files in pages/ directory
        if (!filename.includes('/pages/')) {
          return {}
        }

        return {
          JSXElement(node) {
            const elementName = node.openingElement.name.name

            // Check basic HTML elements with complex classes
            if (['div', 'span', 'section', 'article'].includes(elementName)) {
              const classAttr = node.openingElement.attributes.find(
                attr => attr.name?.name === 'className'
              )

              if (classAttr && classAttr.value?.value) {
                const classValue = classAttr.value.value
                const classCount = classValue.split(' ').length

                // If more than 5 Tailwind classes, suggest extraction
                if (classCount > 5) {
                  context.report({
                    node,
                    messageId: 'complexStyling',
                  })
                }
              }
            }
          },
        }
      },
    },
  },
}
