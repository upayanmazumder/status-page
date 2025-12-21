// Example showcasing the UI Component Library
// This demonstrates how to use the centralized UI components

import { useState } from 'react';
import {
  Button,
  Input,
  FormField,
  Card,
  Modal,
  Badge,
  StatusIndicator,
  Spinner,
  Container,
} from '@/components/ui';

export default function UIShowcase() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 2000));
    setLoading(false);
    setIsModalOpen(false);
  };

  return (
    <Container size="lg">
      <div className="space-y-8 py-8">
        <h1 className="text-4xl font-bold text-white mb-8">UI Component Showcase</h1>

        {/* Buttons Section */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-2xl font-bold text-white mb-4">Buttons</h2>
          <div className="flex flex-wrap gap-4">
            <Button variant="primary">Primary</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="success">Success</Button>
            <Button variant="danger">Danger</Button>
            <Button variant="ghost">Ghost</Button>
            <Button size="sm">Small</Button>
            <Button size="lg">Large</Button>
            <Button isLoading>Loading</Button>
          </div>
        </Card>

        {/* Inputs Section */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-2xl font-bold text-white mb-4">Form Fields</h2>
          <div className="space-y-4 max-w-md">
            <FormField label="Email Address" type="email" placeholder="Enter your email" required />
            <FormField
              label="Password"
              type="password"
              placeholder="Enter password"
              error="Password must be at least 8 characters"
              required
            />
            <Input
              placeholder="Input with helper text"
              helperText="This is some helpful information"
            />
          </div>
        </Card>

        {/* Badges & Status */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-2xl font-bold text-white mb-4">Badges & Status</h2>
          <div className="space-y-4">
            <div className="flex flex-wrap gap-3">
              <Badge variant="default">Default</Badge>
              <Badge variant="primary">Primary</Badge>
              <Badge variant="success" dot>
                Success
              </Badge>
              <Badge variant="warning">Warning</Badge>
              <Badge variant="danger">Danger</Badge>
              <Badge variant="info">Info</Badge>
            </div>
            <div className="flex flex-wrap gap-3">
              <StatusIndicator status="online" pulse />
              <StatusIndicator status="offline" />
              <StatusIndicator status="warning" />
              <StatusIndicator status="unknown" showLabel={false} />
            </div>
          </div>
        </Card>

        {/* Loading States */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-2xl font-bold text-white mb-4">Loading States</h2>
          <div className="flex flex-wrap gap-6 items-center">
            <Spinner size="sm" />
            <Spinner size="md" />
            <Spinner size="lg" />
            <Spinner size="xl" />
          </div>
        </Card>

        {/* Modal Example */}
        <Card variant="bordered" padding="lg">
          <h2 className="text-2xl font-bold text-white mb-4">Modal</h2>
          <Button onClick={() => setIsModalOpen(true)}>Open Modal</Button>
        </Card>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Example Modal"
          size="md"
        >
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              label="Email"
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              required
            />
            <FormField
              label="Password"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              required
            />
            <div className="flex gap-3 pt-4">
              <Button type="submit" fullWidth isLoading={loading}>
                Submit
              </Button>
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => setIsModalOpen(false)}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Modal>
      </div>
    </Container>
  );
}
