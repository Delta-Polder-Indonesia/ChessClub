export default function DualRingSpinner({ color = '#3b82f6', speed = 1, scale = 1 }) {
  return (
    <div className="relative flex items-center justify-center" style={{ transform: `scale(${scale})` }}>
      <div 
        className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" 
        style={{ borderColor: `${color} transparent transparent transparent`, animationDuration: `${speed}s` }}
      />
      <div 
        className="absolute w-7 h-7 border-4 border-b-transparent rounded-full animate-spin" 
        style={{ borderColor: `transparent transparent ${color} transparent`, animationDuration: `${speed * 0.7}s`, animationDirection: 'reverse' }}
      />
    </div>
  );
}