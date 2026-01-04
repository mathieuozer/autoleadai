import { render, screen } from '@testing-library/react';
import { Table, TableHeader, TableBody, TableRow, TableHead, TableCell } from '../Table';

describe('Table', () => {
  it('renders a table element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toBeInTheDocument();
  });

  it('applies custom className', () => {
    render(
      <Table className="custom-class">
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('table')).toHaveClass('custom-class');
  });
});

describe('TableHeader', () => {
  it('renders thead element', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('rowgroup')).toBeInTheDocument();
  });

  it('has gray background', () => {
    render(
      <Table>
        <TableHeader data-testid="header">
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByTestId('header')).toHaveClass('bg-gray-50');
  });
});

describe('TableBody', () => {
  it('renders tbody element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('rowgroup')).toBeInTheDocument();
  });

  it('has divide-y class for row separation', () => {
    render(
      <Table>
        <TableBody data-testid="body">
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('body')).toHaveClass('divide-y');
  });
});

describe('TableRow', () => {
  it('renders tr element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('row')).toBeInTheDocument();
  });

  it('is hoverable by default', () => {
    render(
      <Table>
        <TableBody>
          <TableRow data-testid="row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('row')).toHaveClass('hover:bg-blue-50');
  });

  it('can disable hover effect', () => {
    render(
      <Table>
        <TableBody>
          <TableRow isHoverable={false} data-testid="row">
            <TableCell>Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByTestId('row')).not.toHaveClass('hover:bg-blue-50');
  });
});

describe('TableHead', () => {
  it('renders th element', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('columnheader')).toBeInTheDocument();
  });

  it('has uppercase text', () => {
    render(
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Header</TableHead>
          </TableRow>
        </TableHeader>
      </Table>
    );
    expect(screen.getByRole('columnheader')).toHaveClass('uppercase');
  });
});

describe('TableCell', () => {
  it('renders td element', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell>Cell content</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('cell')).toHaveTextContent('Cell content');
  });

  it('applies custom className', () => {
    render(
      <Table>
        <TableBody>
          <TableRow>
            <TableCell className="custom-class">Cell</TableCell>
          </TableRow>
        </TableBody>
      </Table>
    );
    expect(screen.getByRole('cell')).toHaveClass('custom-class');
  });
});
