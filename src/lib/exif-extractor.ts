// ============================================================================
// EXIF DATA EXTRACTOR
// File: src/lib/exif-extractor.ts
// Deskripsi: Ekstraksi metadata EXIF dari foto untuk audit
// ============================================================================

import EXIF from 'exif-js'

// ============================================================================
// EXTRACT EXIF DATA
// ============================================================================

export async function extractExifData(file: File): Promise<Record<string, any>> {
    return new Promise((resolve) => {
        const reader = new FileReader()

        reader.onload = (e) => {
            const arrayBuffer = e.target?.result as ArrayBuffer

            if (!arrayBuffer) {
                resolve({})
                return
            }

            try {
                // @ts-ignore - EXIF library tidak punya type definition yang baik
                EXIF.getData(file, function () {
                    // @ts-ignore
                    const allMetaData = EXIF.getAllTags(this)

                    const exifData = {
                        // Camera info
                        camera_make: allMetaData.Make || null,
                        camera_model: allMetaData.Model || null,

                        // Date info
                        date_taken: allMetaData.DateTimeOriginal || allMetaData.DateTime || null,

                        // GPS info (untuk deteksi lokasi pengambilan foto)
                        gps_latitude: allMetaData.GPSLatitude || null,
                        gps_longitude: allMetaData.GPSLongitude || null,
                        gps_altitude: allMetaData.GPSAltitude || null,

                        // Camera settings
                        iso: allMetaData.ISOSpeedRatings || null,
                        aperture: allMetaData.FNumber || null,
                        exposure_time: allMetaData.ExposureTime || null,
                        focal_length: allMetaData.FocalLength || null,

                        // Image dimensions
                        width: allMetaData.PixelXDimension || null,
                        height: allMetaData.PixelYDimension || null,

                        // Software info
                        software: allMetaData.Software || null,

                        // Orientation
                        orientation: allMetaData.Orientation || null,
                    }

                    // Filter out null values
                    const filteredData = Object.entries(exifData).reduce((acc, [key, value]) => {
                        if (value !== null) {
                            acc[key] = value
                        }
                        return acc
                    }, {} as Record<string, any>)

                    console.log('📸 EXIF data extracted:', filteredData)
                    resolve(filteredData)
                })
            } catch (error) {
                console.error('❌ Error extracting EXIF:', error)
                resolve({})
            }
        }

        reader.onerror = () => {
            console.error('❌ Error reading file for EXIF')
            resolve({})
        }

        reader.readAsArrayBuffer(file)
    })
}

// ============================================================================
// FORMAT EXIF DATA FOR DISPLAY
// ============================================================================

export function formatExifForDisplay(exifData: Record<string, any>): string[] {
    const formatted: string[] = []

    if (exifData.camera_make || exifData.camera_model) {
        formatted.push(`📷 ${exifData.camera_make || ''} ${exifData.camera_model || ''}`.trim())
    }

    if (exifData.date_taken) {
        formatted.push(`📅 ${exifData.date_taken}`)
    }

    if (exifData.iso) {
        formatted.push(`ISO ${exifData.iso}`)
    }

    if (exifData.aperture) {
        formatted.push(`ƒ/${exifData.aperture}`)
    }

    if (exifData.exposure_time) {
        formatted.push(`${exifData.exposure_time}s`)
    }

    if (exifData.focal_length) {
        formatted.push(`${exifData.focal_length}mm`)
    }

    if (exifData.width && exifData.height) {
        formatted.push(`${exifData.width}×${exifData.height}`)
    }

    return formatted
}

// ============================================================================
// CHECK IF IMAGE HAS GPS DATA
// ============================================================================

export function hasGpsData(exifData: Record<string, any>): boolean {
    return !!(exifData.gps_latitude && exifData.gps_longitude)
}

// ============================================================================
// GET COORDINATES FROM EXIF
// ============================================================================

export function getCoordinates(exifData: Record<string, any>): { lat: number; lng: number } | null {
    if (!hasGpsData(exifData)) return null

    try {
        // Convert GPS coordinates (biasanya dalam format DMS - Degrees, Minutes, Seconds)
        const lat = convertDMSToDD(exifData.gps_latitude, exifData.GPSLatitudeRef)
        const lng = convertDMSToDD(exifData.gps_longitude, exifData.GPSLongitudeRef)

        return { lat, lng }
    } catch (error) {
        console.error('Error converting GPS coordinates:', error)
        return null
    }
}

// ============================================================================
// HELPER: CONVERT DMS TO DECIMAL DEGREES
// ============================================================================

function convertDMSToDD(dms: any, ref: string): number {
    if (typeof dms === 'number') return dms

    const [degrees, minutes, seconds] = dms
    let dd = degrees + minutes / 60 + seconds / 3600

    if (ref === 'S' || ref === 'W') {
        dd = dd * -1
    }

    return dd
}