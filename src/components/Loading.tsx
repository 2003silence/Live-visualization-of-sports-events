import React from 'react';
import styled from 'styled-components';

const LoadingContainer = styled.div`
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    background-color: #f5f5f5;
`;

const LoadingText = styled.h2`
    color: #333;
    margin-top: 20px;
    font-size: 24px;
`;

const Spinner = styled.div`
    width: 50px;
    height: 50px;
    border: 5px solid #f3f3f3;
    border-top: 5px solid #3498db;
    border-radius: 50%;
    animation: spin 1s linear infinite;

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
`;

const LoadingProgress = styled.div`
    width: 200px;
    height: 4px;
    background-color: #ddd;
    border-radius: 2px;
    margin-top: 20px;
    overflow: hidden;

    &::after {
        content: '';
        display: block;
        width: 40%;
        height: 100%;
        background-color: #3498db;
        animation: progress 1s ease-in-out infinite;
        border-radius: 2px;
    }

    @keyframes progress {
        0% { transform: translateX(-100%); }
        100% { transform: translateX(250%); }
    }
`;

interface LoadingProps {
    message?: string;
}

export const Loading: React.FC<LoadingProps> = ({ message = '加载中...' }) => {
    return (
        <LoadingContainer>
            <Spinner />
            <LoadingText>{message}</LoadingText>
            <LoadingProgress />
        </LoadingContainer>
    );
}; 