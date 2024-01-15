import React, { useState, useCallback, useEffect, useRef } from "react";

// component css
import "../css/ScrollDiv.css";

const min_height = 20;

/**
 * Copied from Harsh Kurra, 'Build an On-hover Custom Scrollbar in React'.
 *
 */
export const ScrollDiv = ({
  children,
  className,
  ...props
}) {
  const [hovering, setHovering] = useState(false);
  const [scrollBoxHeight, setScrollBoxHeight] = useState(SCROLL_BOX_MIN_HEIGHT);
  const [scrollBoxTop, setScrollBoxTop] = useState(0);
  const [lastScrollThumbPosition, setScrollThumbPosition] = useState(0);
  const [isDragging, setDragging] = useState(false);

  /**
   * Event handlers
   */

  const hMouseOver = useCallback(() => {
    !hovering && setHovering(true);
  }, [hovering]);

  const hMouseOut = useCallback(() => {
    !!hovering && setHovering(false);
  }, [hovering]);

  const hDocumentMouseUp = useCallback(
    e => {
      if (isDragging) {
        e.preventDefault();
        setDragging(false);
      }
    },
    [isDragging]
  );

  const hDocumentMouseMove = useCallback(
    e => {
      if (isDragging) {
        e.preventDefault();
        e.stopPropagation();
        const scrollHostElement = scrollHostRef.current;
        const { scrollHeight, offsetHeight } = scrollHostElement;

        let deltaY = e.clientY - lastScrollThumbPosition;
        let percentage = deltaY * (scrollHeight / offsetHeight);

        setScrollThumbPosition(e.clientY);
        setScrollBoxTop(
          Math.min(
            Math.max(0, scrollBoxTop + deltaY),
            offsetHeight - scrollBoxHeight
          )
        );
        scrollHostElement.scrollTop = Math.min(
          scrollHostElement.scrollTop + percentage,
          scrollHeight - offsetHeight
        );
      }
    },
    [isDragging, lastScrollThumbPosition, scrollBoxHeight, scrollBoxTop]
  );

  const hScrollThumbMouseDown = useCallback(e => {
    e.preventDefault();
    e.stopPropagation();
    setScrollThumbPosition(e.clientY);
    setDragging(true);
    console.log("hScrollThumbMouseDown");
  }, []);

  const hScroll = useCallback(() => {
    if (!scrollHostRef) {
      return;
    }
    const scrollHostElement = scrollHostRef.current;
    const { scrollTop, scrollHeight, offsetHeight } = scrollHostElement;

    let newTop =
      (parseInt(scrollTop, 10) / parseInt(scrollHeight, 10)) * offsetHeight;
    // newTop = newTop + parseInt(scrollTop, 10);
    newTop = Math.min(newTop, offsetHeight - scrollBoxHeight);
    setScrollBoxTop(newTop);
  }, []);

  const scrollHostRef = useRef();

  useEffect(() => {
    const scrollHostElement = scrollHostRef.current;
    const { clientHeight, scrollHeight } = scrollHostElement;
    const scrollThumbPercentage = clientHeight / scrollHeight;
    const scrollThumbHeight = Math.max(
      scrollThumbPercentage * clientHeight,
      SCROLL_BOX_MIN_HEIGHT
    );
    setScrollBoxHeight(scrollThumbHeight);
    scrollHostElement.addEventListener("scroll", hScroll, true);
    return function cleanup() {
      scrollHostElement.removeEventListener("scroll", hScroll, true);
    };
  }, []);

  useEffect(() => {
    //this is handle the dragging on scroll-thumb
    document.addEventListener("mousemove", hDocumentMouseMove);
    document.addEventListener("mouseup", hDocumentMouseUp);
    document.addEventListener("mouseleave", hDocumentMouseUp);
    return function cleanup() {
      document.removeEventListener("mousemove", hDocumentMouseMove);
      document.removeEventListener("mouseup", hDocumentMouseUp);
      document.removeEventListener("mouseleave", hDocumentMouseUp);
    };
  }, [hDocumentMouseMove, hDocumentMouseUp]);

  return (
    <div
      className={"scrollhost-container"}
      onMouseOver={hMouseOver}
      onMouseOut={hMouseOut}
    >
      <div
        ref={scrollHostRef}
        className={`scrollhost ${className}`}
        {...props}
      >
        {children}
      </div>
      <div className={"scroll-bar"} style={{ opacity: hovering ? 1 : 0 }}>
        <div
          className={"scroll-thumb"}
          style={{ height: scrollBoxHeight, top: scrollBoxTop }}
          onMouseDown={hScrollThumbMouseDown}
        />
      </div>
    </div>
  );
}
