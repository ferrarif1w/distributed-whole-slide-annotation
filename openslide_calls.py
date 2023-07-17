# The path can also be read from a config file, etc.
OPENSLIDE_PATH = r'C:\Program Files\openslide\openslide-win64-20221217\bin'

import os
if hasattr(os, 'add_dll_directory'):
    # Python >= 3.8 on Windows
    with os.add_dll_directory(OPENSLIDE_PATH):
        import openslide
else:
    import openslide

import io, base64, sys, json, math

FILE_LOG = "python_data.txt"
FILE_JSON = "data.json"

def get_image_data(image_object):
    img_io = io.BytesIO()
    image_object.save(img_io, format='PNG')
    byte_array = img_io.getvalue()
    byte_array = base64.b64encode(byte_array).decode('ascii')
    return byte_array

def get_image(data):
    # aprire file
    with open(FILE_JSON, 'r') as json_file:
        json_data = json.load(json_file)
        slide_name = json_data['slide']
    slide = openslide.OpenSlide(slide_name)

    # convertire data in json vero
    with open(FILE_LOG, 'a') as p:
        try:
            data_dict = json.loads(data)
            coord = tuple(data_dict['coord'])
            liv = tuple(data_dict['liv'])
            dim = tuple(data_dict['dim'])
            p.write("COORD: " + str(coord) + "\n")
            p.write("LIV: " + str(liv) + "\n")
            p.write("DIM: " + str(dim) + "\n")
            p.write(">>>>>>>>>>>>>>>>>>>>\n")
        except:
            for el in sys.exc_info():
               p.write(str(el) + "\n")

    # decifrare il livello e ottenere downsample
    cur_liv, new_liv = liv
    ds_times = slide.level_downsamples[cur_liv]
    ds_over = slide.level_downsamples[new_liv]
    dim_max_level = slide.level_dimensions[slide.level_count-1]
    dim0 = slide.level_dimensions[0]
    # scalare coord e dim
    percent = (coord[0] / dim_max_level[0], coord[1] / dim_max_level[1])
    coord = tuple(math.ceil(percent[i]*dim0[i]) for i in range(2))
    dim = tuple(math.ceil(d*(ds_times/ds_over)) for d in dim)
    # usare read_region 
    image_object = slide.read_region(coord, new_liv, dim)
    image = get_image_data(image_object)
    # restituire dati (json with dimension, level and image binary data)
    return_data = {"dim": dim, "liv": new_liv, "image": image}

    return json.dumps(return_data)

def get_starter_image(data):
    # save slide name and write it in json file
    slide_dict = json.loads(data)
    slide_name = os.path.dirname(__file__) + slide_dict['slide']
    slide_dict['slide'] = slide_name
    with open(FILE_JSON, 'w') as json_file:
        json.dump(slide_dict, json_file)
    # get max level and its image size
    slide = openslide.OpenSlide(slide_name)
    max_level = slide.level_count - 1
    max_level_str = (max_level,max_level)
    max_level_dim = slide.level_dimensions[max_level]
    # call get_image and return data
    data = json.dumps({'coord': (0,0), 'liv': max_level_str, 'dim': max_level_dim})

    # python_data
    with open(FILE_LOG, 'w') as p:
        p.write("STARTING\n---------------------\n")

    starter_image = get_image(data)
    data = json.loads(starter_image)
    data["ds"] = ','.join([str(d) for d in slide.level_downsamples])
    return json.dumps(data)

if __name__ == "__main__":
    function_request = str(sys.argv[1])
    try:
        data = str(sys.argv[2])
        print(locals()[function_request](data))
    except IndexError:
        print(locals()[function_request]())