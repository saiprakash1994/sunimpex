import * as React from "react";
import Svg, { Circle, G, Line, Path, Polyline, Rect } from "react-native-svg";

export const HomeIcon = (props: any) => (
    <Svg
        id="Layer_1"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        viewBox="0 0 32 32"
        enableBackground="new 0 0 32 32"
        xmlSpace="preserve"
        width='25px'
        height='25px'
        {...props}
    >
        <Polyline
            fill={props.color}
            stroke={props.color}
            strokeWidth={1.5}
            strokeMiterlimit={10}
            points="3,17 16,4 29,17 "
        />
        <Polyline
            fill={props.color}
            stroke={props.color}
            strokeWidth={1.5}
            strokeMiterlimit={10}
            points="6,14 6,27 13,27 13,17 19,17 19,27 26,27  26,14 "
        />
    </Svg>
);
export const AccountIcon = (props: any) => (
    <Svg
        width="25px"
        height="25px"
        viewBox="0 0 24 24"
        fill={props.color}
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Circle
            cx={12}
            // fill={props.color ===`${THEME_COLORS.secondary}`? props.color : 'none' }
            cy={7}
            r={4}
            fill={props.color}
            // stroke={props.color}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
        <Path
            d="M4 21V17C4 15.8954 4.89543 15 6 15H18C19.1046 15 20 15.8954 20 17V21"
            // stroke={props.color}
            strokeWidth={2}
            fill={props.color}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>

);
export const DairyIcon = (props: any) => (
    <Svg
        fill="none"
        width="25px"
        height="25px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props} // Forward additional props like style, color, etc
    >
        <Path
            d="M9,21h6a1,1,0,0,0,1-1.08l-.21-2.46a23.7,23.7,0,0,1,.1-4.91h0A3.12,3.12,0,0,0,15,9.92h0a3.13,3.13,0,0,1-1-2.25V4a1,1,0,0,0-1-1H11a1,1,0,0,0-1,1V7.67A3.13,3.13,0,0,1,9,9.92H9a3.12,3.12,0,0,0-.93,2.63h0a23.7,23.7,0,0,1,.1,4.91L8,19.92A1,1,0,0,0,9,21Z"
            stroke={props.color || "black"}
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
        />
    </Svg>
);
export const DeviceIcon = (props: any) => (
    <Svg
        width="25px"
        height="25px"
        viewBox="0 0 16 16"
        id="device-16px"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Rect
            id="Ret\xE2ngulo_223"
            data-name="Ret\xE2ngulo 223"
            width={16}
            height={16}
            fill={props.color}
            opacity={0}
        />
        <G id="Icone" transform="translate(0.648 0.648)">
            <G
                id="Ret\xE2ngulo_203"
                data-name="Ret\xE2ngulo 203"
                transform="translate(2.352 2.352)"
                fill="none"
                stroke={props.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
            >
                <Rect width={10} height={10} stroke="none" />
                <Rect x={0.5} y={0.5} width={9} height={9} fill="none" />
            </G>
            <G
                id="Ret\xE2ngulo_206"
                data-name="Ret\xE2ngulo 206"
                transform="translate(5.352 5.352)"
                fill="none"
                stroke={props.color}
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
            >
                <Rect width={4} height={4} stroke="none" />
                <Rect x={0.5} y={0.5} width={3} height={3} fill="none" />
            </G>
            <G id="Grupo_327" data-name="Grupo 327" transform="translate(-0.191 1)">
                <Line
                    id="Linha_24"
                    data-name="Linha 24"
                    y1={3}
                    transform="translate(5.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_28"
                    data-name="Linha 28"
                    y1={3}
                    transform="translate(7.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_29"
                    data-name="Linha 29"
                    y1={3}
                    transform="translate(9.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
            </G>
            <G id="Grupo_328" data-name="Grupo 328" transform="translate(-0.191 -11)">
                <Line
                    id="Linha_24-2"
                    data-name="Linha 24"
                    y1={3}
                    transform="translate(5.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_28-2"
                    data-name="Linha 28"
                    y1={3}
                    transform="translate(7.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_29-2"
                    data-name="Linha 29"
                    y1={3}
                    transform="translate(9.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
            </G>
            <G
                id="Grupo_329"
                data-name="Grupo 329"
                transform="translate(1 14.895) rotate(-90)"
            >
                <Line
                    id="Linha_24-3"
                    data-name="Linha 24"
                    y1={3}
                    transform="translate(5.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_28-3"
                    data-name="Linha 28"
                    y1={3}
                    transform="translate(7.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_29-3"
                    data-name="Linha 29"
                    y1={3}
                    transform="translate(9.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
            </G>
            <G
                id="Grupo_330"
                data-name="Grupo 330"
                transform="translate(-11 14.895) rotate(-90)"
            >
                <Line
                    id="Linha_24-4"
                    data-name="Linha 24"
                    y1={3}
                    transform="translate(5.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_28-4"
                    data-name="Linha 28"
                    y1={3}
                    transform="translate(7.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
                <Line
                    id="Linha_29-4"
                    data-name="Linha 29"
                    y1={3}
                    transform="translate(9.543 10.852)"
                    fill="none"
                    stroke={props.color}
                    strokeLinecap="round"
                    strokeWidth={1}
                />
            </G>
        </G>
    </Svg>
);


export const ReportsIcon = (props: any) => (
    <Svg
        xmlns="http://www.w3.org/2000/svg"
        fill={props.color}
        width="800px"
        height="800px"
        viewBox="0 0 36 36"
        {...props}
    >
        <Rect x={6.48} y={18} width={5.76} height={11.52} rx={1} ry={1} />
        <Rect x={15.12} y={6.48} width={5.76} height={23.04} rx={1} ry={1} />
        <Rect x={23.76} y={14.16} width={5.76} height={15.36} rx={1} ry={1} />
    </Svg>
);

export const SettingsIcon = (props: any) => (
    <Svg
        width="25px"
        height="25px"
        viewBox="0 0 48 48"
        xmlns="http://www.w3.org/2000/svg"
        enableBackground="new 0 0 48 48"
        {...props}
    >
        <Path
            fill={props.color}
            d="M39.6,27.2c0.1-0.7,0.2-1.4,0.2-2.2s-0.1-1.5-0.2-2.2l4.5-3.2c0.4-0.3,0.6-0.9,0.3-1.4L40,10.8 c-0.3-0.5-0.8-0.7-1.3-0.4l-5,2.3c-1.2-0.9-2.4-1.6-3.8-2.2l-0.5-5.5c-0.1-0.5-0.5-0.9-1-0.9h-8.6c-0.5,0-1,0.4-1,0.9l-0.5,5.5 c-1.4,0.6-2.7,1.3-3.8,2.2l-5-2.3c-0.5-0.2-1.1,0-1.3,0.4l-4.3,7.4c-0.3,0.5-0.1,1.1,0.3,1.4l4.5,3.2c-0.1,0.7-0.2,1.4-0.2,2.2 s0.1,1.5,0.2,2.2L4,30.4c-0.4,0.3-0.6,0.9-0.3,1.4L8,39.2c0.3,0.5,0.8,0.7,1.3,0.4l5-2.3c1.2,0.9,2.4,1.6,3.8,2.2l0.5,5.5 c0.1,0.5,0.5,0.9,1,0.9h8.6c0.5,0,1-0.4,1-0.9l0.5-5.5c1.4-0.6,2.7-1.3,3.8-2.2l5,2.3c0.5,0.2,1.1,0,1.3-0.4l4.3-7.4 c0.3-0.5,0.1-1.1-0.3-1.4L39.6,27.2z M24,35c-5.5,0-10-4.5-10-10c0-5.5,4.5-10,10-10c5.5,0,10,4.5,10,10C34,30.5,29.5,35,24,35z"
        />
        <Path
            fill={props.color}
            d="M24,13c-6.6,0-12,5.4-12,12c0,6.6,5.4,12,12,12s12-5.4,12-12C36,18.4,30.6,13,24,13z M24,30 c-2.8,0-5-2.2-5-5c0-2.8,2.2-5,5-5s5,2.2,5,5C29,27.8,26.8,30,24,30z"
        />
    </Svg>
);

export const UploadIcon = (props: any) => (
    <Svg
        fill={props.color}
        width="25px"
        height="25px"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path d="M8.71,7.71,11,5.41V15a1,1,0,0,0,2,0V5.41l2.29,2.3a1,1,0,0,0,1.42,0,1,1,0,0,0,0-1.42l-4-4a1,1,0,0,0-.33-.21,1,1,0,0,0-.76,0,1,1,0,0,0-.33.21l-4,4A1,1,0,1,0,8.71,7.71ZM21,12a1,1,0,0,0-1,1v6a1,1,0,0,1-1,1H5a1,1,0,0,1-1-1V13a1,1,0,0,0-2,0v6a3,3,0,0,0,3,3H19a3,3,0,0,0,3-3V13A1,1,0,0,0,21,12Z" />
    </Svg>
);

export const RateChart = (props: any) => (
    <Svg
        stroke={props.color}
        fill={props.color}
        strokeWidth={0}
        viewBox="0 0 512 512"
        className="me-2"
        height="25px"
        width="25px"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path d="M464 32H48C21.49 32 0 53.49 0 80v352c0 26.51 21.49 48 48 48h416c26.51 0 48-21.49 48-48V80c0-26.51-21.49-48-48-48zM224 416H64v-96h160v96zm0-160H64v-96h160v96zm224 160H288v-96h160v96zm0-160H288v-96h160v96z" />
    </Svg>
)

export const GroupPeople = (props: any) => (
    <Svg
        fill={props.color || '#000'}
        width={props.size || 25}
        height={props.size || 25}
        viewBox="0 0 640 512"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path d="M72 88a56 56 0 1 1 112 0A56 56 0 1 1 72 88zM64 245.7C54 256.9 48 271.8 48 288s6 31.1 16 42.3l0-84.7zm144.4-49.3C178.7 222.7 160 261.2 160 304c0 34.3 12 65.8 32 90.5l0 21.5c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-26.8C26.2 371.2 0 332.7 0 288c0-61.9 50.1-112 112-112l32 0c24 0 46.2 7.5 64.4 20.3zM448 416l0-21.5c20-24.7 32-56.2 32-90.5c0-42.8-18.7-81.3-48.4-107.7C449.8 183.5 472 176 496 176l32 0c61.9 0 112 50.1 112 112c0 44.7-26.2 83.2-64 101.2l0 26.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32zm8-328a56 56 0 1 1 112 0A56 56 0 1 1 456 88zM576 245.7l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM320 32a64 64 0 1 1 0 128 64 64 0 1 1 0-128zM240 304c0 16.2 6 31 16 42.3l0-84.7c-10 11.3-16 26.1-16 42.3zm144-42.3l0 84.7c10-11.3 16-26.1 16-42.3s-6-31.1-16-42.3zM448 304c0 44.7-26.2 83.2-64 101.2l0 42.8c0 17.7-14.3 32-32 32l-64 0c-17.7 0-32-14.3-32-32l0-42.8c-37.8-18-64-56.5-64-101.2c0-61.9 50.1-112 112-112l32 0c61.9 0 112 50.1 112 112z" />
    </Svg>
)

export const CowIcon = (props: any) => (
    <Svg
        width="28px"
        height="28px"
        viewBox="0 0 128 128"
        xmlns="http://www.w3.org/2000/svg"
        xmlnsXlink="http://www.w3.org/1999/xlink"
        aria-hidden="true"
        role="img"
        className="iconify iconify--noto"
        preserveAspectRatio="xMidYMid meet"
        {...props}
    >
        <Path
            d="M30.98 25c-.28-.14 1.69-2.6 2.39-3.8c.7-1.2 1.27-3.1 2.75-2.96s1.62 2.75 1.55 3.87c-.14 2.25-1.41 4.79-1.41 4.79L30.98 25z"
            fill="#ffbd16"
        />
        <Path
            d="M90.18 73.92l-41.91 7.72s.45 2.7 1.22 5.73s3.66 11.68 3.52 15.27c-.14 3.59-2.89 10.84-1.9 12.39s4.58 1.48 6.69.99s4.32-2.02 4.6-2.93s-.38-9.03-.31-10.93s.49-5.56 1.2-8.38c.7-2.82 1.13-7.95 1.13-7.95l10.21-5.21s7.11 5.42 9.08 8.31s3.45 9.08 3.38 11.61c-.07 2.53-1.74 9.79-.66 11.1c1.34 1.62 4.56 1.83 6.66 1.64c2.58-.23 4.83-1.64 4.83-1.64V81.31l-7.74-7.39z"
            fill="#adadb8"
        />
        <Path
            d="M117.07 81.59c-1.69-.07-3.23 6-2.75 8.66c.7 3.87 3.52 5.21 4.43 6.48c.92 1.27 1.45 2.84 2.53 3.31c1.13.49 2.44-4.92 2.32-9.08c-.13-5.15-4.25-9.27-6.53-9.37z"
            fill="#4d4d4d"
        />
        <Path
            d="M84.27 81.87l-5.42 5.07s2.49 2.8 4.5 4.22c2.39 1.69 4.65 1.97 4.65 1.97s-.49 4.01 1.9 4.36c2.23.33 2.04-4.08 2.39-4.15c.35-.07 1.06 3.24 2.96 3.17s5.42-7.46 5.42-7.46L96.3 78l-12.03 3.87z"
            fill="#fea8a7"
        />
        <Path
            d="M44.17 29.08c.14-.35-1.41-1.69-2.89-2.67c-1.48-.99-4.36-1.34-4.36-1.34l-12.88 6.26l-7.81 7.56s-3.28 2.3-4.69 3.28c-1.41.99-3.73 2.56-4.93 3.33s-2.18 1.2-2.39 2.11s4.34 8.28 4.34 8.28l2.39 1.76l5.7-.49s7.6 3.52 11.12 4.79c3.52 1.27 11.54 3.87 11.54 3.87s1.48 4.01 2.46 6.26c.99 2.25 2.98 5.37 2.98 5.37l20.67 9.97s1.97 7.81 2.32 9.85s.77 7.74.63 10.49s-.72 7.27-.63 8.45c.09 1.31 1.28 2.95 3.03 3.24c2.89.47 6.34-.56 7.81-2.6s-.35-7.67-.56-10c-.21-2.32-1.21-7.63-.49-9.36c1.2-2.89 2.39-6.55 2.6-7.81c.21-1.27.7-3.31.7-3.31s3.8.07 6.9-.35c3.1-.42 6.19-1.06 6.19-1.06s.99 4.15 1.13 6.69c.14 2.53.63 7.53.56 11.47s-1.41 8.73-.99 9.71c.42.99 1.27 2.72 5.21 2.18c4.17-.57 5.16-2.75 5.58-3.73s.96-9.71 1.53-11.97c.56-2.25 2.39-11.12 3.38-14.15c.99-3.03 4.65-14.36 4.65-14.36s0 4.72.28 6.62s.84 5.98 1.97 5.84c1.13-.14.77-3.52.84-5.77c.07-2.25-.07-5.42.77-8.09c.84-2.67 1.63-6.9 1.69-7.39c.52-3.99-.07-8.66-.14-9.43s-5.7-4.43-5.7-4.43s.14-2.93-.21-3.36c-.35-.42-5.49-4.32-7.09-4.65c-2.67-.55-5.37.4-5.37.4L87.1 51.6L59.93 40.48s-2.67-.07-3.52-.07c-.84 0-4.86-1.69-4.86-1.69l-4.65-4.29l-2.73-5.35z"
            fill="#dfdfdf"
        />
        <Path
            d="M107.14 60.83c-.58-5.25 1.62-10.14 2.96-12.25s2.84-4.06 3.21-4.62c.35-.52 7.23 5.58 7.04 8.45c-.03.5-.94 6.48-1.88 9.24c-.76 2.25-2.65 7.81-3.28 8.02c-.63.21-7.34-2.51-8.05-8.84z"
            fill="#4d4d4d"
        />
        <Path
            d="M106.93 67.79c-1.88-.05-3.31 1.83-5 3.73s-3.03 3.38-2.75 5.28c.28 1.9 2.39 5 6.26 4.58c3.87-.42 4.93-4.36 5-6.76c.08-2.39-.69-6.76-3.51-6.83z"
            fill="#4d4d4d"
        />
        <Path
            d="M81.83 40.15c-9.64.14-21 .09-22.2.38c-.7.16 1.76 8.61 5.91 12.98s17.07 19.94 26.61 15.84c6.55-2.82 5.28-12.04 6.34-16.82c1.06-4.79 5.87-12.27 5.87-12.27s-14.72-.22-22.53-.11z"
            fill="#4d4d4d"
        />
        <Path
            d="M60.33 25.42c.84 1.15-3.66 7.67-5.14 9.36s-4.43 3.66-4.43 3.66s2.49.94 2.91 1.29c.42.35 3.82 6.59 3.85 8.35c.05 3.05-6.48 10.84-9.5 10.77c-3.03-.07-10.35-4.93-11.33-6.26c-.99-1.34-2.25-13.02-.77-16.82c1.48-3.8 4.36-6.76 5.21-6.9s1.9.14 1.9.14s3.38-2.46 8.45-3.38s8.29-.98 8.85-.21z"
            fill="#4d4d4d"
        />
        <Path
            d="M44.99 36.82c-.49-.56.71-4.59 4.01-6.97c3.52-2.53 7.25-2.46 7.88-1.97c.7.54-1.45 4.52-4.15 6.55c-3.38 2.53-7.25 2.96-7.74 2.39z"
            fill="#ffd1b3"
        />
        <Path
            d="M16.41 44.78s4.22-8.45 7.53-10.84s6.73-3.28 9.64-4.29c4.43-1.55 6.12-4.86 6.12-4.86s-5.91-1.34-10.84.14c-3.63 1.09-7.32 3.45-8.87 5.35c-1.55 1.9-2.56 5.32-3.66 7.11c-1.34 2.18-4.55 4.58-4.55 4.58s1.1.23 2.39 1.08c.55.35 2.24 1.73 2.24 1.73z"
            fill="#4d4d4d"
        />
        <Path
            d="M37.53 26.41c.16.57.61 1.82 1.62 2.53c1.19.85 3.04 1.09 4.22.63c2.18-.84 2.93-5.7 3.1-7.18c.28-2.53-.14-4.65-1.48-4.43c-.91.14-3.59 3.49-4.36 4.08c-1.2.92-3.67 2.32-3.1 4.37z"
            fill="#ffbd16"
        />
        <Path
            d="M26.5 37.95c.52-.23 1.27-1.88 2.77-1.74s2.68 1.9 2.21 3.89c-.47 1.97-1.7 2.57-3.05 2.3c-1.17-.23-1.74-1.55-1.97-1.74c-.23-.19-2.58-.42-2.53-1.41c.04-.97 2.57-1.3 2.57-1.3z"
            fill="#1b1b1b"
        />
        <Path
            d="M7.31 55.59c-.42.52.43 2.18 2.25 2.82c2.23.77 3.73.73 5.37.31c1.32-.34 2.56-1.15 2.56-1.15s2.64-1.01 1.48-2.37c-1.6-1.88-3.59 1.1-3.59 1.1s-1.34.82-3.78.49c-1.9-.26-3.17-1.95-3.17-1.95l-1.12.75z"
            fill="#4d4d4d"
        />
        <Path
            d="M12.98 50.2c.19-.97.49-1.66-2.11-2.44c-2.67-.8-5.21-1.22-6.29-.7c-.55.26-1.22 3.1.28 5.96c.85 1.62 2.49 4.41 3.28 4.08s2.23-2.75 2.67-3.33c.63-.8 1.85-1.93 2.17-3.57z"
            fill="#fca4a7"
        />
        <Path
            d="M11.34 49.73c-.04 1.36-2.11 2.77-4.55 2.06s-2.86-2.49-2.72-3.52c.14-1.03 2.02-.05 3.24.19c1.22.24 4.08-.19 4.03 1.27z"
            fill="#ffd3af"
        />
        <Path
            d="M70.19 69.53c-2.2.5-4.32 4.27-4.08 7.41c.21 2.77 2.51 6.18 6.19 6.57c3.52.38 6.1-2.86 6.01-5.77c-.07-2.16-2.46-3.32-3.8-4.93c-2.16-2.58-2.87-3.61-4.32-3.28z"
            fill="#4d4d4d"
        />
        <Path
            d="M45.6 68.97c-1.13.47-1.5 2.39-1.69 3.57s0 3.43.56 4.6c.56 1.17 3.71 6.24 4.6 6.95c.89.7 4.93 2.44 9.48 3.1s6.95.42 6.95.42s-1.27-2.58-2.25-4.97c-.99-2.39-2.39-6.48-4.27-8.68s-11.34-5.84-13.38-4.99z"
            fill="#4d4d4d"
        />
    </Svg>
);
export const BufIcon = (props: any) => (

    <Svg
        width={28}
        height={28}
        viewBox="0 0 144 144"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path
            d="M123 72C123.06 70.5 123.108 59.928 114 57.354V108H102V93L90.048 81.138L60 96.048V108H48V96L36 84L30 96C30 96 30 96 24 96C20.532 96 18 90 18 90C18 90 9 72 9 60C9 53.376 14.376 48 21 48H31.104C33.582 41.022 40.176 36 48 36C48.984 36 49.932 36.138 50.874 36.288L114 48.144C128.964 50.58 132 64.338 131.994 72.234L132 78H123V72Z"
            fill="#5D4037"
        />
        <Path
            opacity={0.4}
            d="M30 69V60C33.534 60 36 57.534 36 54V48H45V54C45 62.55 38.55 69 30 69Z"
            fill="white"
        />
        <Path
            opacity={0.3}
            d="M132 72V78H123V72H132ZM50.874 36.288C49.932 36.138 48.984 36 48 36C40.176 36 33.582 41.022 31.104 48H21C14.376 48 9 53.376 9 60H11.934C19.176 60 25.59 63.264 30 68.328V60C33.534 60 36 57.534 36 54V48H45V54C45 62.376 38.802 68.688 30.516 68.952C33.876 73.08 35.976 78.27 35.994 84H36L48 96V108H60V78.048C60 78.048 60.126 65.106 68.424 55.404C72.144 51.054 84.018 42.516 84.018 42.516L50.874 36.288Z"
            fill="#000000"
        />
    </Svg>
);

export const LogoutIcon = (props: any) => (
    <Svg
        width="25px"
        height="25px"
        viewBox="0 0 15 15"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        {...props}
    >
        <Path
            fillRule="evenodd"
            clipRule="evenodd"
            d="M1 1L8 1V2L2 2L2 13H8V14H1L1 1ZM10.8536 4.14645L14.1932 7.48614L10.8674 11.0891L10.1326 10.4109L12.358 8L4 8V7L12.2929 7L10.1464 4.85355L10.8536 4.14645Z"
            fill={props.color}
        />
    </Svg>
);