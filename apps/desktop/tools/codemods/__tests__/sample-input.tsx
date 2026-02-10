import React from 'react'

import { Button, Input, Card, Badge } from "@/components/ui";

export function TestComponent() {
  return (
    <div>
      {/* Test button transformations */}
      <Button variant="primary">Primary Button</Button>
      <Button variant="secondary">Secondary Button</Button>
      <Button variant="outline">Outline Button</Button>
      <Button variant="ghost">Ghost Button</Button>
      <Button variant="danger">Danger Button</Button>
      {/* Button with additional classes */}
      <Button variant="primary" className="w-full mt-4">Full Width Primary</Button>
      {/* Test input transformations */}
      <Input type="text" placeholder="Regular input" />
      <Input type="text" placeholder="Error input" error={true} />
      <Input className="w-full" type="text" placeholder="Full width input" />
      {/* Test card transformations */}
      <Card>
        <h3>Card Title</h3>
        <p>Card content</p>
      </Card>
      <Card hover={true}>
        <h3>Hover Card</h3>
      </Card>
      <Card interactive={true}>
        <h3>Interactive Card</h3>
      </Card>
      <Card className="flex flex-col gap-4" hover={true} interactive={true}>
        <h3>Complex Card</h3>
      </Card>
      {/* Test badge transformations */}
      <Badge variant="primary">Primary Badge</Badge>
      <Badge variant="success">Success Badge</Badge>
      <Badge variant="warning">Warning Badge</Badge>
      <Badge variant="danger">Danger Badge</Badge>
      <Badge variant="info">Info Badge</Badge>
      <Badge>Default Badge</Badge>
      {/* Badge with additional classes */}
      <Badge className="ml-2" variant="success">Success with margin</Badge>
      {/* Legacy badge aliases */}
      <Badge variant="primary">Indigo (maps to primary)</Badge>
      <Badge variant="success">Green (maps to success)</Badge>
      <Badge variant="warning">Amber (maps to warning)</Badge>
      <Badge>Gray (maps to default)</Badge>
    </div>
  );
}
