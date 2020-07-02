from pathlib import Path

import yaml


def yaml_test_configs(directory: Path):
    """
    Return a dict of filename: yaml dict pairs for
    all yaml configs in the given directory
    """
    cases = {}
    for filename in directory.iterdir():
        with filename.open("r") as f:
            cases[filename] = yaml.load(f, Loader=yaml.SafeLoader)
    return cases


def pytest_generate_tests(metafunc):

    # Parametrize a test using each good .yaml config
    if "good_channel_config" in metafunc.fixturenames:
        d = Path(metafunc.config.rootdir, "tests/unit/good_configs")
        configs = []
        filenames = []
        for f, c in yaml_test_configs(d).items():
            configs.append(c)
            filenames.append(f.parts[-1])
        metafunc.parametrize("good_channel_config", configs, ids=filenames)

    # Parametrize this test using each BAD .yaml config
    if "bad_channel_config" in metafunc.fixturenames:
        d = Path(metafunc.config.rootdir, "tests/unit/bad_configs")
        configs = []
        filenames = []
        for f, c in yaml_test_configs(d).items():
            configs.append(c)
            filenames.append(f.parts[-1])
        metafunc.parametrize("bad_channel_config", configs, ids=filenames)
