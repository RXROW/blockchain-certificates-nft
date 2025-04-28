import React from 'react';
import styled from 'styled-components';



const Loading = ({
  variant = 'spinner',
  size = 'medium',
  text = 'Loading...'
}) => {
  const sizeClass = {
    small: 'spinner-small',
    medium: 'spinner-medium',
    large: 'spinner-large'
  }[size];

  if (variant === 'cube') {
    return (
      <StyledWrapper>
        <div className="cube">
          <div className="face front" />
          <div className="face back" />
          <div className="face right" />
          <div className="face left" />
          <div className="face top" />
          <div className="face bottom" />
        </div>
      </StyledWrapper>
    );
  }

  return (
    <div className="loading-container">
      <div className={`loading-spinner ${sizeClass}`}></div>
      {text && <p className="loading-text">{text}</p>}
    </div>
  );
};

const StyledWrapper = styled.div`
  .cube {
    top: -100px;
    margin: 200px auto 0;
    width: 100px;
    height: 100px;
    position: relative;
    transform-style: preserve-3d;
    animation: spin 3s infinite cubic-bezier(0.16, 0.61, 0.49, 0.91);
  }

  .face {
    position: absolute;
    width: 100%;
    height: 100%;
    background: #5d00e9;
    border: 2px solid #fff;
    border-radius: 5px;
    box-shadow: 0 0 15px #5d00e9;
  }

  .top {
    transform: rotateX(90deg) translateZ(50px);
    animation: shift-top 3s infinite ease-out;
  }

  .bottom {
    transform: rotateX(-90deg) translateZ(50px);
    animation: shift-bottom 3s infinite ease-out;
  }

  .right {
    transform: rotateY(90deg) translateZ(50px);
    animation: shift-right 3s infinite ease-out;
  }

  .left {
    transform: rotateY(-90deg) translateZ(50px);
    animation: shift-left 3s infinite ease-out;
  }

  .front {
    transform: translateZ(50px);
    animation: shift-front 3s infinite ease-out;
  }

  .back {
    transform: rotateY(-180deg) translateZ(50px);
    animation: shift-back 3s infinite ease-out;
  }

  @keyframes spin {
    33% {
      transform: rotateX(-36deg) rotateY(-405deg);
    }
    100% {
      transform: rotateX(-36deg) rotateY(-405deg);
    }
  }

  @keyframes shift-top {
    33% { transform: rotateX(90deg) translateZ(50px); }
    50%, 60% { transform: rotateX(90deg) translateZ(100px); }
    75% { transform: rotateX(90deg) translateZ(50px); }
  }

  @keyframes shift-bottom {
    33% { transform: rotateX(-90deg) translateZ(50px); }
    50%, 60% { transform: rotateX(-90deg) translateZ(100px); }
    75% { transform: rotateX(-90deg) translateZ(50px); }
  }

  @keyframes shift-right {
    33% { transform: rotateY(90deg) translateZ(50px); }
    50%, 60% { transform: rotateY(90deg) translateZ(100px); }
    75% { transform: rotateY(90deg) translateZ(50px); }
  }

  @keyframes shift-left {
    33% { transform: rotateY(-90deg) translateZ(50px); }
    50%, 60% { transform: rotateY(-90deg) translateZ(100px); }
    75% { transform: rotateY(-90deg) translateZ(50px); }
  }

  @keyframes shift-front {
    33% { transform: translateZ(50px); }
    50%, 60% { transform: translateZ(100px); }
    75% { transform: translateZ(50px); }
  }

  @keyframes shift-back {
    33% { transform: rotateY(-180deg) translateZ(50px); }
    50%, 60% { transform: rotateY(-180deg) translateZ(100px); }
    75% { transform: rotateY(-180deg) translateZ(50px); }
  }
`;

export default Loading;
