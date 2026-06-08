const COVER_MAP = {
  经济学: '/static/covers/economics.png',
  心理学: '/static/covers/psychology.png',
  物理学: '/static/covers/physics.png',
  计算机科学: '/static/covers/cs.png',
  哲学: '/static/covers/philosophy.png',
  社会学: '/static/covers/sociology.png',
  跨学科: '/static/covers/general.png',
};

export function getCategoryCover(category) {
  return COVER_MAP[category] || COVER_MAP['跨学科'];
}
