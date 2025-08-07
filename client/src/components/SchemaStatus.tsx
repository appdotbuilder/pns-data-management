
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CheckCircle } from 'lucide-react';

export function SchemaStatus() {
  const schemaFeatures = [
    {
      table: 'users',
      feature: 'pegawai_id foreign key',
      constraint: "references pegawai.id with onDelete: 'set null'",
      status: 'implemented'
    },
    {
      table: 'riwayat_jabatan',
      feature: 'pegawai_id foreign key',
      constraint: "references pegawai.id with onDelete: 'cascade'",
      status: 'implemented'
    },
    {
      table: 'mutasi',
      feature: 'pegawai_id foreign key',
      constraint: "references pegawai.id with onDelete: 'cascade'",
      status: 'implemented'
    },
    {
      table: 'all tables',
      feature: 'updated_at auto-update',
      constraint: '$onUpdate(() => new Date()) for automatic timestamp updates',
      status: 'implemented'
    }
  ];

  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-green-700">
            📊 Database Schema Status
          </CardTitle>
          <CardDescription>
            Current status of foreign key constraints and automatic timestamp updates
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {schemaFeatures.map((feature, index) => (
              <div key={index} className="flex items-start space-x-4 p-4 border rounded-lg bg-green-50">
                <CheckCircle className="h-6 w-6 text-green-600 mt-1 flex-shrink-0" />
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <Badge variant="outline" className="text-sm">
                      {feature.table}
                    </Badge>
                    <Badge variant="secondary" className="text-sm bg-green-100 text-green-800">
                      ✓ {feature.status}
                    </Badge>
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1">
                    {feature.feature}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {feature.constraint}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">
              🎯 Schema Implementation Details
            </h3>
            <ul className="text-sm text-blue-800 space-y-1">
              <li>• Foreign key constraints ensure referential integrity</li>
              <li>• CASCADE deletes maintain data consistency for dependent records</li>
              <li>• SET NULL preserves user accounts when pegawai records are removed</li>
              <li>• Automatic timestamp updates track all record modifications</li>
            </ul>
          </div>

          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg">
            <h3 className="font-semibold text-amber-900 mb-2">
              📝 Note on Pension Calculation
            </h3>
            <p className="text-sm text-amber-800">
              The "mendekati pensiun" feature is calculated dynamically from `tmt_jabatan` 
              in the handler logic, as noted in the existing implementation. No explicit 
              `tanggal_pensiun` column has been added to maintain flexibility.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
