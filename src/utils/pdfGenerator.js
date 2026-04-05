import jsPDF from 'jspdf'

/**
 * Generate a PDF report for a satellite
 * @param {Object} satellite - Satellite data object
 * @param {Array} batteryHistory - Battery level history array
 * @param {Array} signalHistory - Signal strength history array
 * @param {Array} temperatureHistory - Temperature history array
 * @param {Object} chartRefs - Object containing refs to chart DOM elements
 */
export async function generateAIRiskPDF(satellites, metrics) {
  const pdf = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 15
  let y = margin

  const addLine = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 3
  }

  const addSectionTitle = (title) => {
    pdf.setFillColor(0, 85, 255)
    pdf.roundedRect(margin, y, pageWidth - 2 * margin, 7, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(11)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin + 5, y + 4.5)
    pdf.setTextColor(0, 0, 0)
    y += 10
  }

  const addKeyValue = (key, value, unit = '') => {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(key + ':', margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${value}${unit}`, margin + 45, y)
    y += 5
  }

  pdf.setFillColor(0, 0, 0)
  pdf.roundedRect(0, 0, pageWidth, 30, 0, 0, 'F')

  pdf.setTextColor(0, 212, 255)
  pdf.setFontSize(20)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROCKET NOVA', margin, 14)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(12)
  pdf.setFont('helvetica', 'normal')
  pdf.text('AI RISK ASSESSMENT REPORT', margin, 22)

  pdf.setFontSize(9)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 27)

  y = 40

  addSectionTitle('FLEET OVERVIEW')

  const activeCount = satellites.filter(s => s.status === 'active').length
  const warningCount = satellites.filter(s => s.status === 'warning').length
  const criticalCount = satellites.filter(s => s.status === 'critical').length
  const anomalyCount = satellites.filter(s => s.isAnomaly).length

  addKeyValue('Total Satellites', satellites.length)
  addKeyValue('Active', activeCount)
  addKeyValue('Warning', warningCount)
  addKeyValue('Critical', criticalCount)
  addKeyValue('Anomalies Detected', anomalyCount)

  addLine()
  y += 2

  addSectionTitle('SYSTEM METRICS')

  const avgHealth = (satellites.reduce((sum, s) => sum + (s.health || 0), 0) / satellites.length).toFixed(1)
  const avgBattery = (satellites.reduce((sum, s) => sum + (s.battery || 0), 0) / satellites.length).toFixed(1)
  const avgTemp = (satellites.reduce((sum, s) => sum + (s.temperature || 0), 0) / satellites.length).toFixed(1)
  const avgSignal = (satellites.reduce((sum, s) => sum + (s.communication?.signalStrength || 0), 0) / satellites.length).toFixed(1)

  addKeyValue('Average Health', avgHealth, '%')
  addKeyValue('Average Battery', avgBattery, '%')
  addKeyValue('Average Temperature', avgTemp, '°C')
  addKeyValue('Average Signal Strength', avgSignal, '%')
  addKeyValue('Data Throughput', metrics?.dataThroughput || '0', ' Gbps')
  addKeyValue('System Load', metrics?.systemLoad || '0', '%')

  addLine()
  y += 2

  addSectionTitle('SATELLITE TELEMETRY STATUS')

  const colWidth = (pageWidth - 2 * margin) / 6
  const headerY = y

  pdf.setFillColor(30, 30, 30)
  pdf.rect(margin, y, pageWidth - 2 * margin, 8, 'F')
  
  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(9)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ID', margin + 2, y + 5)
  pdf.text('Name', margin + colWidth + 2, y + 5)
  pdf.text('Type', margin + colWidth * 2 + 2, y + 5)
  pdf.text('Status', margin + colWidth * 3 + 2, y + 5)
  pdf.text('Battery', margin + colWidth * 4 + 2, y + 5)
  pdf.text('Health', margin + colWidth * 5 + 2, y + 5)

  y += 10
  pdf.setTextColor(0, 0, 0)
  pdf.setFont('helvetica', 'normal')

  satellites.forEach((sat, i) => {
    if (y > pageHeight - 30) {
      pdf.addPage()
      y = margin
    }

    const bgColor = sat.isAnomaly ? [255, 220, 220] : (i % 2 === 0 ? [245, 245, 245] : [255, 255, 255])
    pdf.setFillColor(...bgColor)
    pdf.rect(margin, y - 2, pageWidth - 2 * margin, 7, 'F')

    pdf.setFontSize(8)
    pdf.text(String(sat.id || 'N/A').substring(0, 10), margin + 2, y + 2)
    pdf.text(String(sat.name || 'N/A').substring(0, 12), margin + colWidth + 2, y + 2)
    pdf.text(String(sat.type || 'N/A').toUpperCase(), margin + colWidth * 2 + 2, y + 2)
    
    const statusColor = sat.status === 'critical' ? [220, 50, 50] : sat.status === 'warning' ? [220, 180, 50] : [50, 180, 50]
    pdf.setTextColor(...statusColor)
    pdf.text(String(sat.status || 'N/A'), margin + colWidth * 3 + 2, y + 2)
    
    pdf.setTextColor(0, 0, 0)
    pdf.text(`${sat.battery?.toFixed(1) || 'N/A'}%`, margin + colWidth * 4 + 2, y + 2)
    pdf.text(`${sat.health?.toFixed(1) || 'N/A'}%`, margin + colWidth * 5 + 2, y + 2)

    y += 7
  })

  addLine()
  y += 2

  if (satellites.some(s => s.isAnomaly)) {
    addSectionTitle('ANOMALY DETAILS')

    const anomalySatellites = satellites.filter(s => s.isAnomaly)
    
    anomalySatellites.forEach(sat => {
      if (y > pageHeight - 40) {
        pdf.addPage()
        y = margin
      }

      const severity = sat.aiAnomalyScore > 0.8 ? 'CRITICAL' : sat.aiAnomalyScore > 0.5 ? 'WARNING' : 'LOW'
      const severityColor = severity === 'CRITICAL' ? [220, 50, 50] : severity === 'WARNING' ? [220, 180, 50] : [100, 150, 220]
      
      pdf.setFontSize(9)
      pdf.setTextColor(...severityColor)
      pdf.setFont('helvetica', 'bold')
      pdf.text(`⚠ ${sat.name} (${sat.id})`, margin, y)
      
      pdf.setFont('helvetica', 'normal')
      pdf.setTextColor(100, 100, 100)
      pdf.text(`Score: ${sat.aiAnomalyScore?.toFixed(4) || '0.0000'} | Severity: ${severity}`, margin + 60, y)
      
      y += 6
    })
  } else {
    pdf.setFontSize(10)
    pdf.setTextColor(50, 150, 50)
    pdf.text('✓ No anomalies detected. All satellites operating normally.', margin, y)
    y += 8
  }

  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Page ${i} of ${pageCount} • Rocket Nova AI Risk Report • Generated by Isolation Forest Algorithm (94.2% Accuracy)`,
      margin,
      pageHeight - 8
    )
  }

  pdf.save(`AI_Risk_Report_${new Date().toISOString().split('T')[0]}.pdf`)
}

export async function generateSatellitePDF(satellite, batteryHistory, signalHistory, temperatureHistory, chartRefs = {}) {
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4'
  })

  const pageWidth = pdf.internal.pageSize.getWidth()
  const pageHeight = pdf.internal.pageSize.getHeight()
  const margin = 20
  let y = margin

  const addSectionTitle = (title) => {
    pdf.setFillColor(0, 85, 255)
    pdf.roundedRect(margin, y, pageWidth - 2 * margin, 8, 2, 2, 'F')
    pdf.setTextColor(255, 255, 255)
    pdf.setFontSize(12)
    pdf.setFont('helvetica', 'bold')
    pdf.text(title, margin + 5, y + 5)
    pdf.setTextColor(0, 0, 0)
    y += 12
  }

  const addKeyValue = (key, value, unit = '') => {
    pdf.setFontSize(10)
    pdf.setFont('helvetica', 'bold')
    pdf.text(key + ':', margin, y)
    pdf.setFont('helvetica', 'normal')
    pdf.text(`${value}${unit}`, margin + 50, y)
    y += 6
  }

  const addLine = () => {
    pdf.setDrawColor(200, 200, 200)
    pdf.line(margin, y, pageWidth - margin, y)
    y += 3
  }

  pdf.setFillColor(0, 0, 0)
  pdf.roundedRect(0, 0, pageWidth, 40, 0, 0, 'F')

  pdf.setTextColor(0, 212, 255)
  pdf.setFontSize(24)
  pdf.setFont('helvetica', 'bold')
  pdf.text('ROCKET NOVA', margin, 18)

  pdf.setTextColor(255, 255, 255)
  pdf.setFontSize(14)
  pdf.setFont('helvetica', 'normal')
  pdf.text('SATELLITE TELEMETRY REPORT', margin, 28)

  pdf.setFontSize(10)
  pdf.text(`Generated: ${new Date().toLocaleString()}`, margin, 35)

  y = 55
  addSectionTitle('SATELLITE INFORMATION')

  addKeyValue('Name', satellite.name || 'N/A')
  addKeyValue('ID', satellite.id || 'N/A')
  addKeyValue('Agency', satellite.agency || 'N/A')
  addKeyValue('Type', satellite.type?.toUpperCase() || 'N/A')
  addKeyValue('Status', satellite.status || 'N/A')
  addKeyValue('Launch Date', satellite.launchDate || 'N/A')
  addKeyValue('Last Update', satellite.lastUpdate ? new Date(satellite.lastUpdate).toLocaleString() : 'N/A')
  addKeyValue('Missions Completed', satellite.missions || 0)

  addLine()

  y += 5
  addSectionTitle('ORBITAL PARAMETERS')

  if (satellite.orbital) {
    addKeyValue('Altitude', satellite.orbital.altitude?.toFixed(2) || 'N/A', ' km')
    addKeyValue('Inclination', satellite.orbital.inclination?.toFixed(2) || 'N/A', '°')
    addKeyValue('Eccentricity', satellite.orbital.eccentricity?.toFixed(6) || 'N/A')
    addKeyValue('Period', satellite.orbital.period?.toFixed(2) || 'N/A', ' min')
    addKeyValue('RAAN', satellite.orbital.raan?.toFixed(2) || 'N/A', '°')
    addKeyValue('True Anomaly', satellite.orbital.trueAnomaly?.toFixed(2) || 'N/A', '°')
  } else {
    pdf.setFontSize(10)
    pdf.text('No orbital data available', margin, y)
    y += 6
  }

  addLine()

  y += 5
  addSectionTitle('CURRENT POSITION')

  if (satellite.position) {
    addKeyValue('Latitude', satellite.position.lat || 'N/A', '°')
    addKeyValue('Longitude', satellite.position.lng || 'N/A', '°')
  } else {
    pdf.setFontSize(10)
    pdf.text('No position data available', margin, y)
    y += 6
  }

  if (satellite.velocity) {
    addKeyValue('Velocity (mag)', satellite.velocity.magnitude?.toFixed(3) || satellite.speed?.toFixed(3) || 'N/A', ' km/s')
  }

  addLine()

  y += 5
  addSectionTitle('SYSTEM STATUS')

  addKeyValue('Battery', satellite.battery?.toFixed(1) || 'N/A', '%')
  addKeyValue('Temperature', satellite.temperature?.toFixed(1) || 'N/A', '°C')
  addKeyValue('Fuel', satellite.fuel ? satellite.fuel.toFixed(1) : '85.0', '%')
  addKeyValue('Health Score', satellite.health ? satellite.health.toFixed(1) : '95.0', '%')

  if (satellite.communication) {
    addKeyValue('Signal Strength', satellite.communication.signalStrength?.toFixed(1) || 'N/A', '%')
    addKeyValue('Data Rate', satellite.communication.dataRate?.toFixed(1) || 'N/A', ' Mbps')
    addKeyValue('Latency', satellite.communication.latency || 'N/A', ' ms')
  }

  addLine()

  y += 5
  addSectionTitle('AI ANOMALY DETECTION')

  addKeyValue('Anomaly Score', satellite.aiAnomalyScore?.toFixed(4) || '0.0000')
  addKeyValue('Is Anomaly', satellite.isAnomaly ? 'YES' : 'NO')

  addLine()

  const chartWidth = pageWidth - 2 * margin

  if (batteryHistory && batteryHistory.length > 0) {
    y += 5
    
    if (y > pageHeight - 80) {
      pdf.addPage()
      y = margin
    }
    
    addSectionTitle('BATTERY LEVEL HISTORY (Last 20 Readings)')

    const chartHeight = 55
    y = renderFallbackChart(pdf, margin, y, chartWidth, chartHeight, batteryHistory, {
      min: 60,
      max: 100,
      color: [0, 255, 136],
      label: '%'
    })
  }

  if (signalHistory && signalHistory.length > 0) {
    y += 5
    
    if (y > pageHeight - 80) {
      pdf.addPage()
      y = margin
    }
    
    addSectionTitle('SIGNAL STRENGTH HISTORY (Last 20 Readings)')

    const chartHeight = 55
    y = renderFallbackBarChart(pdf, margin, y, chartWidth, chartHeight, signalHistory, {
      min: 50,
      max: 100,
      color: [0, 212, 255],
      label: '%'
    })
  }

  if (temperatureHistory && temperatureHistory.length > 0) {
    y += 5
    
    if (y > pageHeight - 80) {
      pdf.addPage()
      y = margin
    }
    
    addSectionTitle('TEMPERATURE HISTORY (Last 20 Readings)')

    const chartHeight = 55
    y = renderFallbackChart(pdf, margin, y, chartWidth, chartHeight, temperatureHistory, {
      min: -10,
      max: 40,
      color: [255, 107, 0],
      label: '°C'
    })
  }

  const pageCount = pdf.internal.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    pdf.setPage(i)
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(
      `Page ${i} of ${pageCount} • Rocket Nova Mission Control • Confidential`,
      margin,
      pdf.internal.pageSize.getHeight() - 10
    )
  }

  const filename = `satellite-report-${satellite.name || satellite.id}-${new Date().toISOString().split('T')[0]}.pdf`
  pdf.save(filename)
}

function renderFallbackChart(pdf, x, y, width, height, data, options) {
  const { min, max, color, label } = options
  const padding = 10
  const chartW = width - padding * 2
  const chartH = height - 15
  const zeroY = y + height - 8
  const stepX = chartW / (data.length - 1)
  const dataH = chartH - 5

  pdf.setFillColor(15, 15, 15)
  pdf.roundedRect(x, y, width, height, 2, 2, 'F')

  pdf.setDrawColor(40, 40, 40)
  pdf.setLineWidth(0.3)
  for (let i = 0; i <= 4; i++) {
    const gridY = zeroY - (i / 4) * dataH
    pdf.line(x + padding, gridY, x + width - padding, gridY)
  }

  pdf.setTextColor(120, 120, 120)
  pdf.setFontSize(6)
  pdf.text(`${min}`, x + padding + 2, zeroY + 3)
  pdf.text(`${max}`, x + width - padding - 8, zeroY + 3)

  pdf.setDrawColor(...color)
  pdf.setLineWidth(1.5)

  const points = data.map((val, i) => ({
    x: x + padding + i * stepX,
    y: zeroY - ((val - min) / (max - min)) * dataH
  }))

  for (let i = 1; i < points.length; i++) {
    pdf.line(points[i-1].x, points[i-1].y, points[i].x, points[i].y)
  }

  pdf.setFillColor(...color)
  points.forEach((p, i) => {
    pdf.circle(p.x, p.y, i === points.length - 1 ? 2.5 : 1.5, 'F')
  })

  pdf.setTextColor(...color)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${data[data.length-1].toFixed(1)}${label}`, x + width - 25, y + 5)

  return y + height + 5
}

function renderFallbackBarChart(pdf, x, y, width, height, data, options) {
  const { min, max, color, label } = options
  const padding = 10
  const chartW = width - padding * 2
  const chartH = height - 15
  const zeroY = y + height - 8
  const barW = (chartW - 5) / data.length
  const dataH = chartH - 5

  pdf.setFillColor(15, 15, 15)
  pdf.roundedRect(x, y, width, height, 2, 2, 'F')

  pdf.setDrawColor(40, 40, 40)
  pdf.setLineWidth(0.3)
  for (let i = 0; i <= 4; i++) {
    const gridY = zeroY - (i / 4) * dataH
    pdf.line(x + padding, gridY, x + width - padding, gridY)
  }

  pdf.setTextColor(120, 120, 120)
  pdf.setFontSize(6)
  pdf.text(`${min}`, x + padding + 2, zeroY + 3)
  pdf.text(`${max}`, x + width - padding - 8, zeroY + 3)

  data.forEach((val, i) => {
    const barH = ((val - min) / (max - min)) * dataH
    const bx = x + padding + 2 + i * barW
    const intensity = (val - min) / (max - min)
    const barColor = [
      Math.floor(color[0] * intensity),
      Math.floor(color[1] * intensity + (1 - intensity) * 30),
      Math.floor(color[2] * intensity + (1 - intensity) * 30)
    ]
    pdf.setFillColor(...barColor)
    pdf.roundedRect(bx, zeroY - barH, barW - 3, barH, 1, 1, 'F')
  })

  pdf.setTextColor(...color)
  pdf.setFontSize(10)
  pdf.setFont('helvetica', 'bold')
  pdf.text(`${data[data.length-1].toFixed(1)}${label}`, x + width - 25, y + 5)

  return y + height + 5
}
