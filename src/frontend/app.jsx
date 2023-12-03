const { useState, useEffect, useCallback, useRef } = React;

function App() {
  return (
    <div className="min-w-full min-h-screen screen">
      <div className="w-full h-screen flex">
        <main className="w-full flex flex-col items-center gap-3 pt-6 overflow-auto">
          <h1 className="mt-20 text-3xl md:text-4xl font-black text-center">
            Instant captions for your videos.
          </h1>
          <h2 className="text-xl md:text-2xl text-center my-10 max-w-xl">
            Upload your video and captions. Fast and easy.
          </h2>
          <video controls autoPlay width="620" className="rounded-lg">
            <source src="/flower.webm" type="video/webm" />
            Download the
            <a href="/flower.webm">WEBM</a>
            video.
          </video>
          <button className="btn btn-lg btn-primary my-14">
            Upload Video
          </button> 
        </main>
      </div>
    </div>
  );
}

const container = document.getElementById("react");
ReactDOM.createRoot(container).render(<App />);
