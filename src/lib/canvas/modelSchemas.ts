import type { ModelSchemaMap } from '../../types/canvas/schema'

export const MODEL_SCHEMAS: ModelSchemaMap = {

  // ══════════════════════════════════════════════════════════════
  // IMAGE MODELS
  // ══════════════════════════════════════════════════════════════

  seedream40: {
    modelName: 'Seedream 4.0',
    type: 'image',
    plays: [
      {
        label: '文生图',
        inputs: ['text'],
        apiIds: {
          modelNo: 'de25b2b06d4462579b9b62dff4459f31',
          modelVerNo: 'db8566c5b8ae4c318e5ddc1e13a91df0',
          playRuleId: 'bb351969669b4c24b622f00af9cf9ae9',
        },
        parameters: [
          {
            key: 'size',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'sequential_image_generation',
            label: '组图',
            type: 'select',
            options: [
              { label: '关闭', value: '关闭' },
              { label: '开启', value: '开启' },
            ],
            default: '关闭',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          n_iter: '${n_iter}',
          size: '${size}',
          sequential_image_generation: '${sequential_image_generation}',
        },
      },
      {
        label: '参考生图',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: 'de25b2b06d4462579b9b62dff4459f31',
          modelVerNo: 'db8566c5b8ae4c318e5ddc1e13a91df0',
          playRuleId: 'c8e7e43593804b26bea21817adccb63b',
        },
        parameters: [
          {
            key: 'size',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'sequential_image_generation',
            label: '组图',
            type: 'select',
            options: [
              { label: '关闭', value: '关闭' },
              { label: '开启', value: '开启' },
            ],
            default: '关闭',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          n_iter: '${n_iter}',
          size: '${size}',
          sequential_image_generation: '${sequential_image_generation}',
        },
      },
    ],
  },

  wan27_image: {
    modelName: 'Wan2.7 图像',
    type: 'image',
    plays: [
      {
        label: '文生图',
        inputs: ['text'],
        apiIds: {
          modelNo: '902bf75013eba82859d6240f263abb48',
          modelVerNo: '95ede8b7ad1e4c3cb474db7381124129',
          playRuleId: '65859c116dda4b0a8b059cb10191fdee',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '1920*1080' },
              { label: '4:3', value: '1440*1080' },
              { label: '1:1', value: '1080*1080' },
              { label: '9:16', value: '1080*1920' },
              { label: '3:4', value: '1080*1440' },
            ],
            default: '1080*1920',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'enable_sequential',
            label: '组图',
            type: 'select',
            options: [
              { label: '关闭', value: '关闭' },
              { label: '开启', value: '开启' },
            ],
            default: '关闭',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          n_iter: '${n_iter}',
          aspect_ratio: '${aspect_ratio}',
          enable_sequential: '${enable_sequential}',
        },
      },
    ],
  },

  banana2: {
    modelName: '香蕉2',
    type: 'image',
    plays: [
      {
        label: '文生图',
        inputs: ['text'],
        apiIds: {
          modelNo: '539bf02de1db645689bc0caaf17206ae',
          modelVerNo: '62686b3098794214b5a8ba411a2c8b2f',
          playRuleId: '22a194345ecf4e8e8329b4de61cda728',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '4:3', value: '4:3' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'resolution',
            label: '分辨率',
            type: 'radio',
            options: [
              { label: '0.5K', value: '0.5K' },
              { label: '1K', value: '1K' },
              { label: '2K', value: '2K' },
              { label: '4K', value: '4K' },
            ],
            default: '0.5K',
          },
          {
            key: 'thinking_level',
            label: '推理深度',
            type: 'select',
            options: [
              { label: '低', value: '低' },
              { label: '高', value: '高' },
            ],
            default: '低',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          aspect_ratio: '${aspect_ratio}',
          n_iter: '${n_iter}',
          resolution: '${resolution}',
          thinking_level: '${thinking_level}',
        },
      },
      {
        label: '参考生图',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: '539bf02de1db645689bc0caaf17206ae',
          modelVerNo: '62686b3098794214b5a8ba411a2c8b2f',
          playRuleId: 'd682d3e98216407c98097cc1960fa547',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '4:3', value: '4:3' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'resolution',
            label: '分辨率',
            type: 'radio',
            options: [
              { label: '0.5K', value: '0.5K' },
              { label: '1K', value: '1K' },
              { label: '2K', value: '2K' },
              { label: '4K', value: '4K' },
            ],
            default: '0.5K',
          },
          {
            key: 'thinking_level',
            label: '推理深度',
            type: 'select',
            options: [
              { label: '低', value: '低' },
              { label: '高', value: '高' },
            ],
            default: '低',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          aspect_ratio: '${aspect_ratio}',
          n_iter: '${n_iter}',
          resolution: '${resolution}',
          thinking_level: '${thinking_level}',
        },
      },
    ],
  },

  bananapro: {
    modelName: '香蕉Pro',
    type: 'image',
    plays: [
      {
        label: '文生图',
        inputs: ['text'],
        apiIds: {
          modelNo: '9bd0674b926b158a938731fd05d7bfb1',
          modelVerNo: '15656e1668aa438189f582d5be9999ac',
          playRuleId: 'a7fa1bc201584b3e91e545f7c27d8d5d',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '4:3', value: '4:3' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'resolution',
            label: '分辨率',
            type: 'radio',
            options: [
              { label: '1K', value: '1K' },
              { label: '2K', value: '2K' },
              { label: '4K', value: '4K' },
            ],
            default: '1K',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          aspect_ratio: '${aspect_ratio}',
          n_iter: '${n_iter}',
          resolution: '${resolution}',
        },
      },
      {
        label: '参考生图',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: '9bd0674b926b158a938731fd05d7bfb1',
          modelVerNo: '15656e1668aa438189f582d5be9999ac',
          playRuleId: '8aca80f2d0834563ab1e074ad8557922',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '4:3', value: '4:3' },
              { label: '1:1', value: '1:1' },
              { label: '3:4', value: '3:4' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'n_iter',
            label: '数量',
            type: 'radio',
            options: [
              { label: '1', value: '1' },
              { label: '2', value: '2' },
              { label: '3', value: '3' },
              { label: '4', value: '4' },
            ],
            default: '1',
          },
          {
            key: 'resolution',
            label: '分辨率',
            type: 'radio',
            options: [
              { label: '1K', value: '1K' },
              { label: '2K', value: '2K' },
              { label: '4K', value: '4K' },
            ],
            default: '1K',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          aspect_ratio: '${aspect_ratio}',
          n_iter: '${n_iter}',
          resolution: '${resolution}',
        },
      },
    ],
  },

  // ══════════════════════════════════════════════════════════════
  // VIDEO MODELS — image_list_1 / video_list_1 由 createTask 自动注入 meta
  // ══════════════════════════════════════════════════════════════

  pixverse_v6: {
    modelName: 'Pixverse V6',
    type: 'video',
    plays: [
      {
        label: '文生视频',
        inputs: ['text'],
        apiIds: {
          modelNo: '3097f67d88aecdc69a1a9fb0cc5f014d',
          modelVerNo: '89d93fa494ce4ec68558dc52e1187e34',
          playRuleId: '0e8e07fc79534501b21cc540c5358730',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'select',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '1:1', value: '1:1' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'quality',
            label: '画质',
            type: 'radio',
            options: [
              { label: '540P', value: '540p' },
              { label: '720P', value: '720p' },
              { label: '1080P', value: '1080p' },
            ],
            default: '540p',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: 5,
          aspect_ratio: '${aspect_ratio}',
          n_iter: 1,
          media_output: true,
          generate_multi_clip_switch: true,
          quality: '${quality}',
        },
      },
      {
        label: '图生视频',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: '3097f67d88aecdc69a1a9fb0cc5f014d',
          modelVerNo: '89d93fa494ce4ec68558dc52e1187e34',
          playRuleId: '655aa6dff9aa46709ce1dcaf7071de44',
        },
        parameters: [
          {
            key: 'quality',
            label: '画质',
            type: 'radio',
            options: [
              { label: '540P', value: '540p' },
              { label: '720P', value: '720p' },
              { label: '1080P', value: '1080p' },
            ],
            default: '540p',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: 5,
          n_iter: 1,
          media_output: 'true',
          resolution: '${quality}',
          generate_multi_clip_switch: '关闭',
        },
      },
      {
        label: '首尾帧',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: '3097f67d88aecdc69a1a9fb0cc5f014d',
          modelVerNo: '89d93fa494ce4ec68558dc52e1187e34',
          playRuleId: '15edb30f5c1a47239b2ab6a6943d1b8f',
        },
        parameters: [
          {
            key: 'quality',
            label: '画质',
            type: 'radio',
            options: [
              { label: '540P', value: '540p' },
              { label: '720P', value: '720p' },
              { label: '1080P', value: '1080p' },
            ],
            default: '540p',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: 5,
          n_iter: 1,
          generate_audio_switch: true,
          quality: '${quality}',
        },
      },
    ],
  },

  wan27_video: {
    modelName: 'Wan2.7 视频',
    type: 'video',
    plays: [
      {
        label: '文生视频',
        inputs: ['text'],
        apiIds: {
          modelNo: 'c73eec9ee4006caa1e4dfe7453201f53',
          modelVerNo: '3371b254b5774f96bd2f8fc8a6ed7467',
          playRuleId: '82a55d37594742fe8dddd30e5dd04902',
        },
        parameters: [
          {
            key: 'aspect_ratio',
            label: '比例',
            type: 'radio',
            options: [
              { label: '16:9', value: '16:9' },
              { label: '1:1', value: '1:1' },
              { label: '9:16', value: '9:16' },
            ],
            default: '9:16',
          },
          {
            key: 'resolution',
            label: '画质',
            type: 'radio',
            options: [
              { label: '720P', value: '720P' },
              { label: '1080P', value: '1080P' },
            ],
            default: '720P',
          },
          {
            key: 'duration',
            label: '时长',
            type: 'select',
            options: [
              { label: '2s', value: '2' },
              { label: '3s', value: '3' },
              { label: '4s', value: '4' },
              { label: '5s', value: '5' },
              { label: '6s', value: '6' },
              { label: '8s', value: '8' },
              { label: '10s', value: '10' },
              { label: '15s', value: '15' },
            ],
            default: '5',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: '${duration}',
          aspect_ratio: '${aspect_ratio}',
          n_iter: '1',
          resolution: '${resolution}',
        },
      },
      {
        label: '图生视频',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: 'c73eec9ee4006caa1e4dfe7453201f53',
          modelVerNo: '3371b254b5774f96bd2f8fc8a6ed7467',
          playRuleId: '7c465b2bf40845d6af1c1707b6fb3ff2',
        },
        parameters: [
          {
            key: 'resolution',
            label: '画质',
            type: 'radio',
            options: [
              { label: '720P', value: '720P' },
              { label: '1080P', value: '1080P' },
            ],
            default: '720P',
          },
          {
            key: 'duration',
            label: '时长',
            type: 'select',
            options: [
              { label: '2s', value: '2' },
              { label: '3s', value: '3' },
              { label: '4s', value: '4' },
              { label: '5s', value: '5' },
              { label: '6s', value: '6' },
              { label: '8s', value: '8' },
              { label: '10s', value: '10' },
              { label: '15s', value: '15' },
            ],
            default: '5',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: '${duration}',
          n_iter: '1',
          resolution: '${resolution}',
        },
      },
      {
        label: '首尾帧',
        inputs: ['text', 'image'],
        apiIds: {
          modelNo: 'c73eec9ee4006caa1e4dfe7453201f53',
          modelVerNo: '3371b254b5774f96bd2f8fc8a6ed7467',
          playRuleId: 'dc5d1dab4f6041ccb236423a4aab68fa',
        },
        parameters: [
          {
            key: 'resolution',
            label: '画质',
            type: 'radio',
            options: [
              { label: '720P', value: '720P' },
              { label: '1080P', value: '1080P' },
            ],
            default: '720P',
          },
          {
            key: 'duration',
            label: '时长',
            type: 'select',
            options: [
              { label: '2s', value: '2' },
              { label: '3s', value: '3' },
              { label: '4s', value: '4' },
              { label: '5s', value: '5' },
              { label: '6s', value: '6' },
              { label: '8s', value: '8' },
              { label: '10s', value: '10' },
              { label: '15s', value: '15' },
            ],
            default: '5',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: '${duration}',
          n_iter: '1',
          resolution: '${resolution}',
        },
      },
      {
        label: '视频编辑',
        inputs: ['text', 'video'],
        apiIds: {
          modelNo: 'c73eec9ee4006caa1e4dfe7453201f53',
          modelVerNo: '3371b254b5774f96bd2f8fc8a6ed7467',
          playRuleId: '9ce40eb93d65487cbce63b3688eea090',
        },
        parameters: [
          {
            key: 'resolution',
            label: '画质',
            type: 'radio',
            options: [
              { label: '720P', value: '720P' },
              { label: '1080P', value: '1080P' },
            ],
            default: '720P',
          },
          {
            key: 'duration',
            label: '时长',
            type: 'select',
            options: [
              { label: '2s', value: '2' },
              { label: '3s', value: '3' },
              { label: '4s', value: '4' },
              { label: '5s', value: '5' },
              { label: '6s', value: '6' },
              { label: '8s', value: '8' },
              { label: '10s', value: '10' },
            ],
            default: '5',
          },
        ],
        payloadTemplate: {
          prompt: '${prompt}',
          duration: '${duration}',
          n_iter: '1',
          resolution: '${resolution}',
        },
      },
    ],
  },
}

export const IMAGE_MODELS = Object.entries(MODEL_SCHEMAS)
  .filter(([, m]) => m.type === 'image')
  .map(([id, m]) => ({ id, ...m }))

export const VIDEO_MODELS = Object.entries(MODEL_SCHEMAS)
  .filter(([, m]) => m.type === 'video')
  .map(([id, m]) => ({ id, ...m }))
