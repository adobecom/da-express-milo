export function getGradientsMockData() {
  const gradientTemplates = [
    { name: 'Eternal Sunshine of the Spotless Mind', colors: ['#7B9EA6', '#D0ECF2', '#59391D', '#D99066', '#F34822'], angle: 90 },
    { name: 'Sunset Vibes', colors: ['#FF6B6B', '#FF8E53', '#FFA06B', '#FFD06B', '#FFF96B'], angle: 90 },
    { name: 'Ocean Deep', colors: ['#0A1172', '#1B2B8C', '#2C3FA6', '#3D52C0', '#4E65DA'], angle: 135 },
    { name: 'Aurora Borealis', colors: ['#00FFA3', '#03E1FF', '#8B70FF', '#DC1FFF', '#FF6B9D'], angle: 45 },
    { name: 'Desert Heat', colors: ['#FFE259', '#FFC355', '#FFA751', '#FF8643', '#FF6B35'], angle: 90 },
    { name: 'Purple Dream', colors: ['#8B008B', '#9932CC', '#BA55D3', '#DA70D6', '#EE82EE'], angle: 180 },
    { name: 'Forest Mist', colors: ['#0D3B0D', '#1E5C1E', '#2F7D2F', '#409E40', '#51BF51'], angle: 90 },
    { name: 'Coral Reef', colors: ['#FF6F61', '#FF8577', '#FF9B8D', '#FFB1A3', '#FFC7B9'], angle: 45 },
    { name: 'Midnight Sky', colors: ['#001F3F', '#003D5C', '#005B7A', '#007998', '#0097B6'], angle: 135 },
    { name: 'Cherry Blossom', colors: ['#FFB7C5', '#FFC7D4', '#FFD7E3', '#FFE7F2', '#FFF7FF'], angle: 90 },
    { name: 'Tropical Paradise', colors: ['#00D9FF', '#00E6C3', '#00F387', '#7FFF4B', '#FFFF0F'], angle: 60 },
    { name: 'Autumn Leaves', colors: ['#8B4513', '#A0522D', '#CD853F', '#DEB887', '#F4A460'], angle: 120 },
    { name: 'Ice Cold', colors: ['#E0F7FA', '#B2EBF2', '#80DEEA', '#4DD0E1', '#26C6DA'], angle: 90 },
    { name: 'Fire & Flame', colors: ['#FF0000', '#FF4500', '#FF6347', '#FF7F50', '#FFA07A'], angle: 45 },
    { name: 'Emerald Green', colors: ['#006400', '#228B22', '#32CD32', '#00FF00', '#7FFF00'], angle: 135 },
    { name: 'Royal Purple', colors: ['#4B0082', '#6A0DAD', '#7B1FA2', '#8E24AA', '#9C27B0'], angle: 90 },
    { name: 'Golden Hour', colors: ['#FFD700', '#FFDB58', '#FFDF70', '#FFE388', '#FFE7A0'], angle: 60 },
    { name: 'Deep Ocean', colors: ['#000080', '#00008B', '#0000CD', '#0000FF', '#1E90FF'], angle: 180 },
    { name: 'Peachy Keen', colors: ['#FFDAB9', '#FFDFC4', '#FFE4CF', '#FFE9DA', '#FFEEE5'], angle: 90 },
    { name: 'Neon Lights', colors: ['#FF00FF', '#FF1493', '#FF69B4', '#FF82AB', '#FFB6C1'], angle: 45 },
    { name: 'Misty Morning', colors: ['#F5F5F5', '#E8E8E8', '#DCDCDC', '#D3D3D3', '#C0C0C0'], angle: 135 },
    { name: 'Lavender Fields', colors: ['#E6E6FA', '#DDA0DD', '#DA70D6', '#BA55D3', '#9370DB'], angle: 90 },
    { name: 'Citrus Burst', colors: ['#FFA500', '#FFB733', '#FFC966', '#FFDB99', '#FFEDCC'], angle: 60 },
    { name: 'Stormy Weather', colors: ['#2F4F4F', '#3D5656', '#4B5D5D', '#596464', '#676B6B'], angle: 120 },
    { name: 'Rose Garden', colors: ['#FF0066', '#FF3385', '#FF66A3', '#FF99C2', '#FFCCE0'], angle: 90 },
    { name: 'Electric Blue', colors: ['#0000FF', '#0033FF', '#0066FF', '#0099FF', '#00CCFF'], angle: 45 },
    { name: 'Minty Fresh', colors: ['#98FF98', '#B2FFB2', '#CCFFCC', '#E6FFE6', '#F0FFF0'], angle: 135 },
    { name: 'Sunset Beach', colors: ['#FF6B35', '#F7931E', '#FDBB30', '#FFE66D', '#FFF4CC'], angle: 90 },
    { name: 'Deep Space', colors: ['#0C0C1E', '#1A1A3E', '#28285E', '#36367E', '#44449E'], angle: 180 },
    { name: 'Cotton Candy', colors: ['#FFB6D9', '#FFC7E3', '#FFD8ED', '#FFE9F7', '#FFF5FB'], angle: 60 },
    { name: 'Forest Green', colors: ['#0B3D0B', '#145214', '#1D671D', '#267C26', '#2F912F'], angle: 90 },
    { name: 'Cherry Red', colors: ['#8B0000', '#A52A2A', '#B22222', '#CD5C5C', '#DC143C'], angle: 45 },
    { name: 'Sky Blue', colors: ['#87CEEB', '#87CEFA', '#87CEEB', '#ADD8E6', '#B0E0E6'], angle: 135 },
    { name: 'Lime Green', colors: ['#32CD32', '#7FFF00', '#ADFF2F', '#BFFF00', '#DFFF00'], angle: 90 },
    { name: 'Plum Perfect', colors: ['#8E4585', '#9B5896', '#A86BA7', '#B57EB8', '#C291C9'], angle: 120 },
  ];

  return gradientTemplates.map((template, index) => {
    const stops = template.colors.map((color, i) => ({
      color,
      position: i / (template.colors.length - 1),
    }));
    return {
      id: `gradient-${index + 1}`,
      name: template.name,
      type: 'linear',
      angle: template.angle,
      colorStops: stops,
      coreColors: template.colors,
    };
  });
}
