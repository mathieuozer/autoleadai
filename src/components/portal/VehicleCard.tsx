'use client';

export interface VehicleInfo {
  id: string;
  make: string;
  model: string;
  variant: string;
  year: number;
  color: string;
  vin?: string;
  estimatedDelivery?: string;
  imageUrl?: string;
  specs?: {
    engine?: string;
    transmission?: string;
    fuelType?: string;
  };
}

interface VehicleCardProps {
  vehicle: VehicleInfo;
  className?: string;
}

export function VehicleCard({ vehicle, className = '' }: VehicleCardProps) {
  return (
    <div className={`bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden ${className}`}>
      {/* Vehicle Image Placeholder */}
      <div className="relative h-48 bg-gradient-to-br from-gray-100 to-gray-50 flex items-center justify-center">
        {vehicle.imageUrl ? (
          <img
            src={vehicle.imageUrl}
            alt={`${vehicle.make} ${vehicle.model}`}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="text-center">
            <svg
              className="w-20 h-20 text-gray-300 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M8 7h8m-8 4h8m-4-8v12m-4-4l4-4 4 4M3 17h18M5 21h14a2 2 0 002-2v-1a2 2 0 00-2-2H5a2 2 0 00-2 2v1a2 2 0 002 2z"
              />
            </svg>
            <p className="text-sm text-gray-400 mt-2">Vehicle image</p>
          </div>
        )}
        {/* Color Badge */}
        <div className="absolute top-4 right-4 bg-white/90 backdrop-blur-sm rounded-full px-3 py-1 text-sm font-medium text-gray-700">
          {vehicle.color}
        </div>
      </div>

      {/* Vehicle Details */}
      <div className="p-6">
        <div className="mb-4">
          <h3 className="text-xl font-bold text-gray-900">
            {vehicle.year} {vehicle.make} {vehicle.model}
          </h3>
          <p className="text-gray-500">{vehicle.variant}</p>
        </div>

        {/* Specs Grid */}
        {vehicle.specs && (
          <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-100">
            {vehicle.specs.engine && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Engine</p>
                <p className="text-sm font-medium text-gray-900">{vehicle.specs.engine}</p>
              </div>
            )}
            {vehicle.specs.transmission && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Trans</p>
                <p className="text-sm font-medium text-gray-900">{vehicle.specs.transmission}</p>
              </div>
            )}
            {vehicle.specs.fuelType && (
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Fuel</p>
                <p className="text-sm font-medium text-gray-900">{vehicle.specs.fuelType}</p>
              </div>
            )}
          </div>
        )}

        {/* VIN */}
        {vehicle.vin && (
          <div className="flex items-center justify-between text-sm mb-4">
            <span className="text-gray-500">VIN</span>
            <span className="font-mono text-gray-900">{vehicle.vin}</span>
          </div>
        )}

        {/* Estimated Delivery */}
        {vehicle.estimatedDelivery && (
          <div className="bg-[#7c3aed]/5 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#7c3aed]/10 flex items-center justify-center">
                <svg className="w-5 h-5 text-[#7c3aed]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-xs text-gray-500 uppercase tracking-wide">Estimated Delivery</p>
                <p className="text-lg font-semibold text-gray-900">{vehicle.estimatedDelivery}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
