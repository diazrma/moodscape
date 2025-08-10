if (typeof Sentiment === 'undefined') {

  window.Sentiment = function() {
    this.analyze = function(text) {

      const words = text.toLowerCase().split(/\s+/);
      let score = 0;

      const positive = ['feliz', 'alegre', 'bom', 'ótimo', 'excelente', 'maravilhoso', 'incrível', 'happy', 'good', 'great', 'excellent', 'wonderful', 'amazing'];
      const negative = ['triste', 'ruim', 'péssimo', 'terrível', 'horrível', 'sad', 'bad', 'terrible', 'horrible'];

      words.forEach(word => {
        if (positive.includes(word)) score += 1;
        if (negative.includes(word)) score -= 1;
      });
      
      return {
        score: score,
        comparative: score / words.length,
        tokens: words,
        words: words,
        positive: words.filter(word => positive.includes(word)),
        negative: words.filter(word => negative.includes(word))
      };
    };
  };
}

if (typeof Sentiment !== 'undefined') {
  window.Sentiment = Sentiment;
}